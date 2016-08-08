let React                   = require('react');
let ReactDOM                = require('react-dom');

let $                       = require('jquery');
global.jQuery               = require('jquery');
let bootstrap               = require('bootstrap');

let bs                      = require('react-bootstrap');
let menu                    = require('./menu');
let format                  = require('./lib/format');

// Render component
$(function() {
  var groups = [
    {title: 'Tasks', group: 'tasks'},
    {title: 'Manager', group: 'manager'},
    {title: 'Tools', group: 'tools'},
    {title: 'External Links', group: 'external-links'}
  ];

  groups.forEach(function(obj, index){
    var entries = menu.filter(function(entry) {
      return entry.type !== 'divider' && entry.display && entry.group === obj.group;
    });

    obj.entries = entries.map(function(entry, index) {
      return (
        <div className="landingpage-entry" key={index} >
          <bs.Row >
            <bs.Col xs={3}>
              <a href={entry.link} >
                <format.Icon  name={entry.icon || 'wrench'}
                            size="3x"
                            className="icon"
                            />
              </a>
            </bs.Col>
            <bs.Col xs={7}>
              <a href={entry.link} >
                <div className="text">{entry.title}</div>
              </a>
            </bs.Col>
            <bs.Col xs={2} className="info-col">
              <div className="info-icon">
                <i className="fa fa-info-circle" tabIndex='10' data-toggle="popover" data-content={entry.description} data-trigger="manual" data-placement="auto bottom"></i>
              </div>
            </bs.Col>
          </bs.Row>
        </div>
      );
    });
  });

  ReactDOM.render(
    (
      <div className="landingpage-entries">
        <bs.Row>
          <bs.Col md={8} mdOffset={2} sm={10} smOffset={1}>
            <div className="landingpage-header">
              <h1>Welcome to TaskCluster Tools</h1>
            </div>
          </bs.Col>
        </bs.Row>
        <bs.Row className="landingpage-description">
          <bs.Col sm={10} smOffset={1} md={6} mdOffset={3}>
            <p>
              A collection of tools for TaskCluster components and elements in the TaskCluster eco-system.
              Here you'll find tools to manage TaskCluster as well as run, debug, inspect and view tasks, task-graphs, and
              other TaskCluster related entities.
            </p>
          </bs.Col>
        </bs.Row>
        <bs.Row>
      {
        groups.map(function(group, index) {
          return (
            <bs.Col md={3} sm={6} key={index} className="landingpage-group">
              <div className="landingpage-group-name">{group.title}</div>
              <div className="landingpage-group-entries">
                {group.entries}
              </div>
            </bs.Col>
          );
        })
      }
        </bs.Row>
      </div>
    ),
    $('#container')[0]
  );

  $(function () {
    $('[data-toggle="popover"]').click(function(){
      if($(this).siblings('.popover').length){
        //Close popover if clicking on the opened info icon
        $(this).popover('hide');
      }
      else{
        $(this).popover('show');

        $(this).blur(function(){
          //Close popover if clicking anywhere else
          $(this).popover('hide');
          $(this).unbind('blur');
        });
      }
    });
  });
});
