import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";
import { loadTutorial } from "services/tutorial-service";
import { changeFlag } from "services/user-service";
import {
  updateUser
} from "store/modules/auth/actions";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import "./Tutorial.scss";

const Tutorial = () => {

  const dispatch = useDispatch();

  const history = useHistory();
  const [tutorialPages, setTutorialPages] = useState([]);
  const [page, setPage] = useState(0);
  const [checkboxClicked, setCheckboxClicked] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await loadTutorial();

      if (res.data.status === "success") {
        setTutorialPages(res.data.data);

        dispatch(closeErrName({ name: 'loadTutorial' }));
      } else {
        dispatch(handleErr({ data: res.data, name: 'loadTutorial'}));
      }
    }

    fetchData();
  }, []);

  const changePage = (action) => {
    if (action === "skip") {
      if (checkboxClicked) {
        changeTutorialFlag(checkboxClicked);
      }
      history.push("/home");
    }
    if (action === "next") {
      if (page >= tutorialPages.length - 1) {
        if (checkboxClicked) {
          changeTutorialFlag(checkboxClicked);
        }
        history.push("/home");
      } else {
        setPage(page + 1);
      }
    }
    if (action === "back") {
      setPage(page - 1);
    }
  };

  const changeTutorialFlag = async (tutorialFlag) => {
    const res = await changeFlag(tutorialFlag);

    if (res.data.status === "success") {
      dispatch(updateUser(res.data.data.user));

      dispatch(closeErrName({ name: 'changeFlag' }));
    } else {
      dispatch(handleErr({ data: res.data, name: 'changeFlag'}));
    }
  };

  return (
    <section>
      <div>
        <button onClick={() => changePage("skip")}>Skip</button>
        <div>
          {history.location.pathname !== "/tutorial" && (
            <>
              <h3>Don't Show Again</h3>
              <input
                type="checkbox"
                onClick={() => setCheckboxClicked(!checkboxClicked)}
              />
            </>
          )}
        </div>
      </div>
      <div>
        <h1>{tutorialPages[page]?.title}</h1>
        {tutorialPages[page]?.video && (
          <video
            src={tutorialPages[page]?.video}
            altText={tutorialPages[page]?.altText}
          ></video>
        )}
        {tutorialPages[page]?.image && (
          <image
            src={tutorialPages[page]?.image}
            altText={tutorialPages[page]?.altText}
          />
        )}
        <div
          dangerouslySetInnerHTML={{ __html: tutorialPages[page]?.description }}
        ></div>
      </div>
      <div>
        <button onClick={() => changePage("back")} disabled={page === 0}>
          Back
        </button>
        <button onClick={() => changePage("next")}>
          {page >= tutorialPages.length - 1 && <>Finish</>}
          {page < tutorialPages.length - 1 && <>Next</>}
        </button>
      </div>
    </section>
  );
};

export default Tutorial;
