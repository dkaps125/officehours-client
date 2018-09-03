import React from 'react';
import { Link } from 'react-router-dom';
import { getCourse, courseForId, routeForUser } from '../../Utils';

class ListCourses extends React.Component {
  state = {
    name: '',
    directoryID: ''
  };

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  userCreate = () => {
    // TODO put somewhere else
    const { api } = this.props;
    fetch(`${api}/configure`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state)
    })
  };

  render() {
    return (
      <div style={{background: '#fff', padding:'10px 10px 20px 10px'}}>
        <h3>Create admin</h3>
        <form className="form-inline">
          <div className="form-group">
            <label htmlFor="userName">Name&nbsp;</label>
            <input
              type="text"
              autoComplete="off"
              className="form-control"
              name="name"
              placeholder="John Smith"
              value={this.state.name}
              onChange={this.handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="directoryID">&nbsp;Directory ID&nbsp;</label>
            <input
              type="text"
              autoComplete="off"
              className="form-control"
              name="directoryID"
              placeholder="example"
              value={this.state.directoryID}
              onChange={this.handleInputChange}
            />
          </div>
          &nbsp;
          <button type="button" className="btn btn-default" onClick={this.userCreate}>
            Create
          </button>
        </form>
      </div>
    );
  }
}

export default ListCourses;
