var React             = require('react');
var bs                = require('react-bootstrap');
var utils             = require('../lib/utils');
var taskcluster       = require('taskcluster-client');
var $                 = require('jquery');
var _                 = require('lodash');
var format            = require('../lib/format');
var WorkerTypeView    = require('./workertypeview');
var WorkerTypeEditor  = require('./workertypeeditor');

var WorkerTypeRow = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        queue:          taskcluster.Queue,
        awsProvisioner: taskcluster.AwsProvisioner
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: [
        'provisionerId',
        'workerType'
      ]
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired,
    workerType: React.PropTypes.shape({
      workerType: React.PropTypes.string.isRequired,
      minCapacity: React.PropTypes.number.isRequired,
      maxCapacity: React.PropTypes.number.isRequired,
      requestedCapacity: React.PropTypes.number.isRequired,
      pendingCapacity: React.PropTypes.number.isRequired,
      runningCapacity: React.PropTypes.number.isRequired,
    }).isRequired,
    selected: React.PropTypes.bool.isRequired,
    onClick: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      pendingTasks: {pendingTasks: 0},
      pendingTasksLoaded: false,
      pendingTasksError: undefined,
    };
  },

  load() {
    return {
      pendingTasks: this.queue.pendingTasks(
        this.props.provisionerId,
        this.props.workerType.workerType
      ),
    };
  },

  render() {
    return (
      <tr
        onClick={this.props.onClick}
        className={this.props.selected ? 'active' : undefined}
        style={{cursor: 'pointer'}}>
        <td>{this.props.workerType.workerType}</td>
        <td className="text-right">
          {(this.props.workerType.runningCapacity + this.props.workerType.requestedCapacity + this.props.workerType.pendingCapacity) + '/' + this.props.workerType.maxCapacity }
        </td>
        <td>
          <bs.OverlayTrigger placement='left' overlay={this.tooltip()}>
          {this.renderCapacityBar()}
          </bs.OverlayTrigger>
        </td>
        <td className="text-center">{this.state.pendingTasksLoaded ? this.state.pendingTasks.pendingTasks + " Tasks" : "..."}</td>
        <td>
          <div className="worker-type-row-caret text-right">
            {(this.props.selected) ? <i className="fa fa-caret-up"></i> : <i className="fa fa-caret-down"></i>}
          </div>
        </td>
      </tr>
    );
  },

  renderCapacityBar() {
    var p = this.doMath();
    let pgs = [];
    if (p.r) {
      pgs.push(
        <bs.ProgressBar bsStyle='success' key='running' now={p.r} label={p.rc}/>
      );
    }
    if (p.p) {
      pgs.push(
        <bs.ProgressBar bsStyle='warning' key='pending' now={p.p} label={p.pc}/>
      );
    }
    if (p.s) {
      pgs.push(
        <bs.ProgressBar bsStyle='info' key='spotReq' now={p.s} label={p.sc}/>
      );
    }

    return (
      <bs.ProgressBar /*style={{marginBottom: 0}}*/>
        {pgs}
      </bs.ProgressBar>
    );
  },

  /* Return an object which has the fuzzed percentages to use for creating
   * progress bars and the unfuzzed capacities.  If we have a state with 0%, we
   * don't fuzz at all.  If we have 1-4%, we round to 5% and we don't fuzz
   * above 5% for the running, pending and requested numbers */
  doMath() {
    // Actual capacities
    var runningCap = this.props.workerType.runningCapacity;
    var pendingCap = this.props.workerType.pendingCapacity;
    var spotReqCap = this.props.workerType.requestedCapacity;
    var maxCap = this.props.workerType.maxCapacity;

    // We want to make sure that if a bar is there that it's visible
    var smallestCapUnit = maxCap * 0.05;

    // Fuzz the percentages to make sure all bars are visible.  If we have a
    // state with 0%, we don't fuzz at all.  If we have 1-4%, we round to 5%
    // and we don't fuzz above 5%
    var fuzzedRunning = runningCap ? Math.max(runningCap, smallestCapUnit) : 0;
    var fuzzedPending = pendingCap ? Math.max(pendingCap, smallestCapUnit) : 0;
    var fuzzedSpotReq = spotReqCap ? Math.max(spotReqCap, smallestCapUnit) : 0;

    // Determine the number which we should use to figure out our percentages.
    // When we have less than the max configured, we use that setting.  When we
    // exceed that amount, we want to sum up all the capacity units
    var count = fuzzedRunning + fuzzedPending + fuzzedSpotReq;
    var divideBy = Math.max(maxCap, count);

    // Calculate the percentages to use for the bars.  These numbers are
    // invalid for other purposes
    var runPer = fuzzedRunning / divideBy;
    var pendPer = fuzzedPending / divideBy;
    var spotPer = fuzzedSpotReq / divideBy;

    return {
      r: runPer * 100,
      p: pendPer * 100,
      s: spotPer * 100,
      rc: runningCap,
      pc: pendingCap,
      sc: spotReqCap,
    };
  },

  tooltip() {
    return (
      <bs.Tooltip id={this.props.workerType.workerType}>
        {this.props.workerType.workerType} has
        running capacity to handle {this.props.workerType.runningCapacity  || '0'} tasks,
        pending instances to handle {this.props.workerType.pendingCapacity || '0'} tasks, and
        spot requests for capacity to
        handle {this.props.workerType.requestedCapacity  || '0'} tasks in parallel.
      </bs.Tooltip>
    );
  }
});

const defaultWorkerType = {
  "minCapacity": 0,
  "maxCapacity": 5,
  "scalingRatio": 0,
  "minPrice": 0,
  "maxPrice": 0.6,
  "canUseOndemand": false,
  "canUseSpot": true,
  "instanceTypes": [
    {
      "instanceType": "c3.xlarge",
      "capacity": 1,
      "utility": 1,
      "secrets": {},
      "scopes": [],
      "userData": {},
      "launchSpec": {}
    },
  ],
  "regions": [
    {
      "region": "us-west-2",
      "secrets": {},
      "scopes": [],
      "userData": {},
      "launchSpec": {
        "ImageId": "ami-xx"
      }
    }
  ],
  "userData": {},
  "launchSpec": {
  },
  "secrets": {},
  "scopes": []
};


/** Table of workerTypes */
var WorkerTypeTable = React.createClass({
  mixins: [
    utils.createTaskClusterMixin({
      clients: {
        awsProvisioner: taskcluster.AwsProvisioner,
      },
      clientOpts: {
        awsProvisioner: {
          baseUrl:      'https://aws-provisioner.taskcluster.net/v1'
        }
      },
      reloadOnProps: [
        'provisionerId'
      ]
    }),
    utils.createLocationHashMixin({
      keys:           ['selected'],
      type:           'string'
    })
  ],

  propTypes: {
    provisionerId: React.PropTypes.string.isRequired
  },

  getInitialState() {
    return {
      // selected workerType identifier (string)
      // or 'create:worker-type' to indicate creation of workerType
      selected: '',
      workerTypeSummaries: [],
      workerTypeSummariesLoaded: false,
      workerTypeSummariesError: undefined,
    };
  },

  load() {
    return {
      workerTypeSummaries: this.awsProvisioner.listWorkerTypeSummaries()
    };
  },

  setSelected(workerType) {
    var context = this;

    if(this.state.selected == ''){
      this.setState({selected: workerType});
    }
    else{
      $('.worker-type-view-container').slideUp(400, function(){
        if(context.state.selected == workerType){
          context.setState({selected: ''});
        }
        else{
          context.setState({selected: workerType});
        }
      });
    }
  },

  render() {
    return <div>
      <div className="text-center">
        <h1>AWS-Provisioner</h1>
        <h2>Manage Amazon Web Services Workertypes.</h2>
      </div>

      <bs.ButtonToolbar >
        <bs.Button
          className='pull-right'
          bsStyle='default'
          onClick={this.setSelected.bind(this, 'create:worker-type')}
          style={{marginBottom: 10}}>
          <bs.Glyphicon glyph="plus"/>&nbsp;
          Create WorkerType
        </bs.Button>
      </bs.ButtonToolbar>
      {
        this.state.selected === 'create:worker-type' ? (
          this.renderWorkerTypeCreator()
        ) : null
      }
      <div >
        {this.renderWorkerTypeTable()}
        {this.renderWaitFor('workerTypeSummaries') }
      </div>
    </div>
  },

  renderWorkerTypeTable() {
    return (
      <span>
      <bs.Table className="worker-type-table">
        <thead>
          <tr>
            <th>WorkerType</th>
            <th></th>
            <th className='col-md-6'>Capacity</th>
            <th>Pending Tasks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        {
          (this.state.workerTypeSummaries) ?
            this.state.workerTypeSummaries.map(workerType => {
              var output = [];
              output.push(<WorkerTypeRow
                        key={workerType.workerType}
                        provisionerId={this.props.provisionerId}
                        workerType={workerType}
                        selected={this.state.selected === workerType.workerType}
                        onClick={this.setSelected.bind(this, workerType.workerType)}
                        summary={workerType}/>);

              if(this.state.selected === workerType.workerType){
                output.push(
                  <tr className="worker-type-view-row">
                    <td colSpan="5">
                      <div className="worker-type-view-container" key="worker-type-view-container">
                        {this.renderWorkerTypeView()}
                      </div>
                    </td>
                  </tr>
                );
              }

              return output;
            })
          : null
        }
        </tbody>
      </bs.Table>
      </span>
    );
  },

  renderWorkerTypeView() {
    if (!_.find(this.state.workerTypeSummaries, {workerType: this.state.selected})) {
      return undefined;
    }

    return (
      <div style={{paddingTop: 20}}>
        <WorkerTypeView
          provisionerId={this.props.provisionerId}
          workerType={this.state.selected}
          hashEntry={this.nextHashEntry()}
          reload={this.reload}
          updateSummary={this.updateSummary}
        />
      </div>
    );
  },

  updateSummary(workerType, summary) {
    var workerTypeSummaries = this.state.workerTypeSummaries.map(function(wt) {
      if (wt.workerType === workerType) {
        // work around https://github.com/taskcluster/aws-provisioner/pull/70
        return _.assign({workerType: workerType}, summary);
      } else {
        return wt;
      }
    });
    this.setState({workerTypeSummaries: workerTypeSummaries});
  },

  renderWorkerTypeCreator() {
    return (
      <div style={{marginBottom: 50}}>
        <h2>Create New WorkerType</h2>
        <WorkerTypeEditor
          definition={defaultWorkerType}
          updated={this.workerTypeCreated}
          handleCancel={this.handleWorkerTypeCancel}
        />
      </div>
    );
  },

  handleWorkerTypeCancel(){
    this.setState({selected: ''});
  },

  async workerTypeCreated(workerType) {
    await this.reload();
    this.setSelected(workerType);
  }
});

// Export WorkerTypeTable
module.exports = WorkerTypeTable;
