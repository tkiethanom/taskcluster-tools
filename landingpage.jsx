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
        <a href={entry.link} className="landingpage-entry" key={index} data-toggle="popover" data-content={entry.description} data-trigger="hover" data-placement="auto right">
          <bs.Row >
            <bs.Col md={9} sm={9} mdPush={3} smPush={3} >
              <h4>{entry.title}</h4>
            </bs.Col>
            <bs.Col md={3} sm={3} mdPull={9} smPull={9} >
              <format.Icon  name={entry.icon || 'wrench'}
                            size="3x"
                            className="pull-left"
                            style={{padding: '.2em .25em .15em'}}/>
            </bs.Col>
            <div className="hide">{entry.description}</div>
          </bs.Row>
        </a>
      );
    });
  });

  ReactDOM.render(
    (
      <div className="landingpage-entries">
        <bs.Row>
          <bs.Col md={8} mdOffset={2} sm={10} smOffset={1}>
            <div className="landingpage-header">
              <img src={"/lib/assets/taskcluster-180.png"}/>
              <h2><span className="light-font">Welcome to</span> <span className="landingpage-logo">TaskCluster Tools</span></h2>
            </div>
          </bs.Col>
        </bs.Row>
        <bs.Row className="landingpage-description">
          <bs.Col sm={12}>
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
              <h3>{group.title}</h3>
              {group.entries}
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
    $('[data-toggle="popover"]').popover();
  })
});
