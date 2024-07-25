export const errorCustom = (error) => {
  const err = error.toJSON();

  let customError;

  if (err.response) {
    customError = err.response;
    customError = {
      data: {
        status: err.response.status,
        message: `${err.response.data.message}:${JSON.stringify(err.response.data.error)}`
      }
    }
  } else if (err.request) {
    customError = {
      data: {
        status: err.status || "ERROR",
        message: err.request,
      }
    };
  } else {
    customError = {
      data: {
        status: err.status || "ERROR",
        message: err.message,
      }
    };
  }

  return customError;
};

export const errMessage = (status, message) => {
  
  const mappingMessages = [
    {
      status: 'ERROR',
      message: 'Network Error',
      userMessage: 'Sorry, we are experiencing poor internet performance connecting to our servers, if this continues, please contact customer support.'
    },
    {
      status: '502',
      message: 'Request failed with status code 502',
      userMessage: 'We are experiencing significant internet delays connecting from your device, if this continues, please contact customer support.'
    },
    {
      status: '503',
      message: 'Request failed with status code 503',
      userMessage: 'Sorry - Our Trading Server is Temporarily Unavailable, please contact customer support.'
    },
    {
      status: '504',
      message: 'Request failed with status code 504',
      userMessage: 'We are experiencing significant internet delays connecting from your device, if this continues, please contact customer support.'
    }
  ]

  const messageObj = mappingMessages.find(item=>item.status === status && item.message === message );

  if (messageObj) {
    return messageObj.userMessage;
  } else {
    return message;
  }  
}