import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import HelpFAQ from "./components/HelpFAQ";
import HelpTopic from "./components/HelpTopic";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import { loadFaqs, loadTags, loadTopic, loadTopicContent } from "services/help-service";
import "./styles/Help.scss";

const Help = (props) => {

  const dispatch = useDispatch();

  const [topics, setTopics] = useState(null);
  const [tags, setTags] = useState(null);
  const [topicContents, setTopicContents] = useState(null);
  const [faqs, setFaqs] = useState(null);
  const [title, setTitle] = useState('faq');

  useEffect(() => {
    async function fetchData() {
      const resFag = await loadFaqs();

      if (resFag.data.status==="success") {
        setFaqs(resFag.data.data);

        dispatch(closeErrName({ name: 'help-loadFaqs' }));
      } else {
        dispatch(handleErr({ data: resFag.data, name: 'help-loadFaqs'}));
      }

      const resTag = await loadTags();

      if (resTag.data.status==="success") {
        setTags(resTag.data.data);

        dispatch(closeErrName({ name: 'help-loadTags' }));
      } else {
        dispatch(handleErr({ data: resTag.data, name: 'help-loadTags' }));
      }

      const resTopicContent = await loadTopicContent();

      if (resTopicContent.data.status==="success") {
        setTopicContents(resTopicContent.data.data);

        dispatch(closeErrName({ name: 'help-loadTopicContent' }));
      } else {
        dispatch(handleErr({ data: resTopicContent.data, name: 'help-loadTopicContent' }));
      }

      const resTopic = await loadTopic();

      if (resTopic.data.status==="success") {
        setTopics(resTopic.data.data[0]);

        dispatch(closeErrName({ name: 'help-loadTopic' }));
      } else {
        dispatch(handleErr({ data: resTopic.data, name: 'help-loadTopic' }));
      }
    }

    fetchData();
  }, []);

  const changeTitle = (value) => {
    setTitle(value);
  };

  return (
    <div className="help-page my-container">
      <div className="help-page--title">
        <span>Help</span>
      </div>
      <div className="help-page--container">
        <div id="right-side">
          <div className="help-page--list">
            <label htmlFor="faq">
              <input
                type="radio"
                className="help-title"
                id="faq"
                value="faq"
                readOnly
                checked={title === "faq"}
                onChange={() => changeTitle("faq")}
              />
              <div className="help-title">FAQs</div>
            </label>
            <label htmlFor="topic">
              <input
                type="radio"
                className="help-title"
                id="topic"
                value="topic"
                readOnly
                checked={title === "topic"}
                onChange={() => changeTitle("topic")}
              />
              <div className="help-title">Help Topics</div>
            </label>
          </div>
          {
            faqs&&title==='faq'&&
              <div>
                <HelpFAQ faqs={faqs} />
              </div>
          }
          {
            topics&&topicContents&&tags&&title==='topic'&&
              <div className="help-page--content">
                <HelpTopic topic={topics} topicContents={topicContents} tags={tags} />
              </div>
          }
        </div>
      </div>
    </div>
  );
};

export default Help;
