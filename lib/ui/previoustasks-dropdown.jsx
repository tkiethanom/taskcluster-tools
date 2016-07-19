var React           = require('react');
var bs              = require('react-bootstrap');
var utils           = require('../../lib/utils');

var PreviousTasks = React.createClass({

  mixins: [
    // Calls load() initially and on reload()
    utils.createTaskClusterMixin({
      // Reload when props.status.taskId changes, ignore credential changes
      reloadOnProps:          ['objectId', 'objectType'],
      reloadOnLogin:          false
    })
  ],

  getPreviousObjectIds(type, newId) {
    var ids = [];
    var itemKey = 'inspector-items-' + type;
    try {
      var itemValue = JSON.parse(localStorage.getItem(itemKey));
      if (itemValue) {
        ids = itemValue;
      }
    } catch(e) {
      console.error(e);
      localStorage.setItem(itemKey, JSON.stringify(ids));
    }
    if (newId) {
      var prevIndex = ids.indexOf(newId);
      if (prevIndex != -1) {
        ids.splice(prevIndex, 1);
      }
      ids.push(newId);

      while (ids.length > 5) {
        ids.shift();
      }
      // only save when there is a new taskId
      localStorage.setItem(itemKey, JSON.stringify(ids));
    }
    return ids;
  },

  load() {
    return {
      previousObjectIds: this.getPreviousObjectIds(this.props.objectType, this.props.objectId),
      objectId: this.props.objectId,
      objectType: this.props.objectType
    };
  },

  getInitialState() {
    return {
      previousObjectIds: [],
      objectId: '',
      objectType: ''
    };
  },

  handleClick(){

  },

  render() {
    var context = this;
    var objectIds = this.state.previousObjectIds || [];
    var rows = objectIds.map(objectId => {
      var link = "#" + objectId;
      return (<li key={objectId}><a href={link} onClick={context.props.handleDropdownClose}>{objectId}</a></li>);
    });
    rows.reverse(); // show most recent first

    return (
      <div className="previoustasks-dropdown">
        <div className="header-text">Recent History</div>
        <ul>
          {rows}
        </ul>
      </div>
    );
  }
});

module.exports = PreviousTasks;
