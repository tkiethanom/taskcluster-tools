var React           = require('react');
var ReactDOM        = require("react-dom");
var bs              = require('react-bootstrap');
var utils           = require('../lib/utils');
var taskcluster     = require('taskcluster-client');
var _               = require('lodash');
var TaskView        = require('../lib/ui/taskview');
var PreviousTasksDropdown   = require('../lib/ui/previoustasks-dropdown');


/** Renders the task-inspector with a control to enter `taskId` into */
var TaskInspector = React.createClass({
  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Need updated clients for Queue and QueueEvents
      clients: {
        queue:                taskcluster.Queue,
        queueEvents:          taskcluster.QueueEvents
      },
      // Reload when state.taskId changes, ignore credential changes
      reloadOnKeys:           ['taskId'],
      reloadOnLogin:          false
    }),
    // Called handler when state.taskId changes
    utils.createWatchStateMixin({
      onKeys: {
        updateTaskIdInput:    ['taskId']
      }
    }),
    // Listen for messages, reload bindings() when state.taskId changes
    utils.createWebListenerMixin({
      reloadOnKeys:           ['taskId']
    }),
    // Serialize state.taskId to location.hash as string
    utils.createLocationHashMixin({
      keys:                   ['taskId'],
      type:                   'string'
    })
  ],

  getInitialState() {
    return {
      taskId:         '',
      statusLoaded:   true,
      statusError:    undefined,
      status:         null,
      taskIdInput:    '',
      dropdownOpen:   false
    };
  },

  /** Return promised state for TaskClusterMixin */
  load() {
    // Skip loading empty-strings
    if (this.state.taskId === '') {
      return {
        status:         null
      };
    }
    // Reload status structure
    return {
      // Load task status and take the `status` key from the response
      status:     this.queue.status(this.state.taskId)
                            .then(_.property('status'))
    };
  },

  /** Return bindings for WebListenerMixin */
  bindings() {
    // Don't bother listening for empty strings, they're pretty boring
    if (this.state.taskId === '') {
      return [];
    }
    // Construct the routing key pattern
    var routingKey = {
      taskId:     this.state.taskId
    };
    // Return all interesting bindings
    return [
      this.queueEvents.taskDefined(routingKey),
      this.queueEvents.taskPending(routingKey),
      this.queueEvents.taskRunning(routingKey),
      this.queueEvents.artifactCreated(routingKey),
      this.queueEvents.taskCompleted(routingKey),
      this.queueEvents.taskFailed(routingKey),
      this.queueEvents.taskException(routingKey)
    ];
  },

  /** Handle message from listener */
  handleMessage(message) {
    // Update status structure
    this.setState({
      status:           message.payload.status
    });

    // If the message origins from the artifact create exchange, we should
    // notify our children
    if (message.exchange === this.queueEvents.artifactCreated().exchange) {
      if (this.refs.taskView) {
        this.refs.taskView.handleArtifactCreatedMessage(message);
      }
    }
  },

  /** When taskId changed we should update the input */
  updateTaskIdInput() {
    this.setState({taskIdInput: this.state.taskId});
  },

  // Render a task-inspector
  render() {
    // Render
    var invalidInput = false;
    if(this.state.taskIdInput.length > 0){
      invalidInput = !/^[A-Za-z0-9_-]{8}[Q-T][A-Za-z0-9_-][CGKOSWaeimquy26-][A-Za-z0-9_-]{10}[AQgw]$/.test(this.state.taskIdInput);
    }

    return (
      <span>
        <div className="text-center">
          <h1>Task Inspector</h1>
          <h2>This tool lets you inspect a task given the <code>taskId</code></h2>
        </div>
        <bs.Row>
          <bs.Col md={12}>
            <form className="task-inspector-form" onSubmit={this.handleSubmit}>
              <bs.FormGroup
                controlId="formBasicText"
                validationState={invalidInput ? 'error' : null}
                className="task-inspector-form-group"
              >
                <bs.ControlLabel>Enter TaskId</bs.ControlLabel>
                <bs.InputGroup className="task-inspector-input-group">
                  <bs.FormControl
                    type="text"
                    ref="taskId"
                    placeholder="taskId"
                    value={this.state.taskIdInput}
                    onChange={this.handleTaskIdInputChange}
                  />
                  <bs.FormControl.Feedback />
                  <bs.DropdownButton
                    componentClass={bs.InputGroup.Button}
                    id="input-dropdown-addon"
                    title=""
                    pullRight={true}
                    className="task-inspector-dropdown"
                    ref="taskInspectorDropdown"
                    open={this.state.dropdownOpen}
                    onToggle={this.handleDropdownToggle}
                    noCaret={false}
                  >
                    <PreviousTasksDropdown objectId={this.state.taskId} objectType="taskId" handleDropdownClose={this.handleDropdownClose} />
                  </bs.DropdownButton>
                </bs.InputGroup>
              </bs.FormGroup>
              <p className="text-right"> <a href="/index">Find by Index </a></p>
            </form>
          </bs.Col>
        </bs.Row>

      {
        this.renderWaitFor('status') || (this.state.status ? (
          <TaskView
            ref="taskView"
            status={this.state.status}
            hashEntry={this.nextHashEntry()}/>

        ) : (
          undefined
        ))
      }
      </span>
    );
  },

  handleDropdownToggle(){
    if(this.state.dropdownOpen){
      this.setState({
        dropdownOpen: false
      });
    }
    else{
      this.setState({
        dropdownOpen: true
      });
    }
  },

  handleDropdownClose(){
    this.setState({
      dropdownOpen: false
    });
  },

  /** Update TaskIdInput to reflect input */
  handleTaskIdInputChange() {
    this.setState({
      taskIdInput: ReactDOM.findDOMNode(this.refs.taskId).value.trim()
    });
  },

  /** Handle form submission */
  handleSubmit(e) {
    e.preventDefault();
    this.setState({taskId: this.state.taskIdInput});
  }
});

// Export TaskInspector
module.exports = TaskInspector;
