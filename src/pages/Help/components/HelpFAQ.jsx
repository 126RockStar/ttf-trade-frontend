import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import "../styles/HelpFAQ.scss";

const HelpFAQ = ({ faqs }) => {

  const dispatch = useDispatch();

  const [faqStatus, setFaqStatus] = useState(null);

  useEffect(() => {
    try {
      const newFaqStatus = faqs.map((item, index) => ({
        ...item,
        open: index === 0 ? 'show':'',
      }));
  
      setFaqStatus(newFaqStatus);

      dispatch(closeErrName({ name: 'helpFaq-effect1' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'helpFaq-effect1'
      }));
    }    
  }, [faqs]);

  const handleClickFaq = (i) => {
    setFaqStatus((state) => {
      const newState = state.map((item, index) => ({
        ...item,
        open: index === i ? (item.open === 'show' ? '' : 'show') : '',
      }));
      return newState;
    });
  };

  return (
    <div className="help-faq-page">
      <div className="accordion" id="accordionExample">
        {faqStatus &&
          faqStatus.map((faq, idx) => (
            <div className="card" key={idx}>
              <div
                className="card-header"
                id={`heading${idx}`}
                onClick={() => handleClickFaq(idx)}
              >
                <div className="icon">
                  <i className="fa fa-chevron-circle-down" style={{transform:faq.open==='show'?'rotate(180deg)':'rotate(360deg)'}}></i>
                </div>
                <div className="question">
                  <span>{faq.question}</span>
                </div>
              </div>
              <div
                id={`collapse${idx}`}
                className={`collapse ${faq.open}`}
                aria-labelledby={`heading${idx}`}
                data-parent="#accordionExample"
              >
                <p className="card-body">{faq.answer}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default HelpFAQ;
