import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactPlayer from "react-player";
import Card from '@mui/material/Card';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import {
  handleErr,
  closeErrName
} from "store/modules/error/actions";
import "../styles/HelpTopic.scss";

const HelpTopic = ({topic, topicContents, tags}) => {

  const dispatch = useDispatch();

  const [filterContent, setFilterContent] = useState(topicContents);

  const handleClickItem = (treeTags) => {
    try {
      const filterContentUp = topicContents.filter(item=>{
        let count = 0;
        treeTags.forEach(a=>{
          const pass = item.tags.find(b => b === a);
          if (pass) count++;
        })
  
        if (count === treeTags.length) {
          return true
        } else {
          return false
        }
      });
  
      setFilterContent(filterContentUp);

      dispatch(closeErrName({ name: 'helptopic-clickItem' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'helptopic-clickItem'
      }));
    }    
  }

  const renderTree = (nodes) => (
    <TreeItem key={nodes.id} nodeId={nodes.id} label={<span style={{fontSize:'20px'}}>{nodes.label}</span>} onClick={()=>handleClickItem(nodes.tags)} >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  const multiSelectTagChange = (newValue) => {
    try {
      const tagsUp = newValue.map(item=>item.name);

      const filterContentUp = topicContents.filter(item=>{
        let count = 0;
        tagsUp.forEach(a=>{
          const pass = item.tags.find(b => b === a);
          if (pass) count++;
        })

        if (count > 0) {
          return true
        } else {
          return false
        }
      });

      setFilterContent(filterContentUp);

      dispatch(closeErrName({ name: 'helptopic-selectTagChange' }));
    } catch (err) {
      dispatch(handleErr({
        data: {
          status: 'Failed',
          message: err.message
        },
        name: 'helptopic-selectTagChange'
      }));
    }    
  }

  return (
    <div className="help-topic-page">
      <div className="help-topic-page--top">
        <div className="search">
          <Autocomplete
            multiple
            id="tags-outlined"
            options={tags}
            getOptionLabel={(option) => option.name}
            onChange={(event, newValue) => {
              multiSelectTagChange(newValue);
            }}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter Tags"
                placeholder="Favorites"
                size="normal"
              />
            )}
          />
        </div>
      </div>
      <div className="help-topic-page--bottom">
        <div className="left">
          <div className="tree">
            <Card className="card-style">
              <TreeView
                aria-label="rich object"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpanded={['root']}
                defaultExpandIcon={<ChevronRightIcon />}
              >
                {renderTree(topic)}
              </TreeView>
            </Card>
          </div>
        </div>
        <div className="right">
          <Card className="card-style">
            <div className="wrapper">
              {
                filterContent.map((item, index)=>(
                  <div className="box" key={index} >
                    {
                      item.contentType==="video"&&
                        <ReactPlayer
                          url={item.content}
                          width="100%"
                          height="100%"
                        />
                    }
                    {
                      item.contentType==="text"&&
                        <p>{item.content}</p>
                    }
                  </div>
                ))
              }
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpTopic;
