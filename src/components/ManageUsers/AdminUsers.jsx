import React from 'react';
import toastr from 'toastr';

class AdminUsers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.course && this.props.propCourse) {
      this.props.popCourse();
    }
  }

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  render() {
    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="col-md-9">
          <h3>User Management</h3>
          {/* CSV upload of students */}
          {/* Filter by criteria, like name */}
          <UserRoster
            {...this.props}
            userRoster={this.state.userRoster}
            loadUserRoster={this.loadUserRoster}
            noCourse
          />
          {/* Have easy +course button */}
        </div>
      </div>
    );
  }
}

export default AdminUsers;
