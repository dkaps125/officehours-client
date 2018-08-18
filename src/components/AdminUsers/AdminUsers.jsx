import React from 'react';
import toastr from 'toastr';
import UserRoster from '../Instructor/UserRoster';

class AdminUsers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userRoster: null
    };
  }

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  componentDidMount() {
    this.loadUserRoster();
  }

  loadUserRoster = () => {
    // TODO: these kinds of service calls belong in their own API file with exposed hooks
    // they can then be shoved into a context and be told to refresh when needed.
    // This is bad design.
    this.props.client
      .service("/users")
      .find({
        query: {
          $limit: 5000, // TODO: unhardcode this number
          $sort: { createdAt: -1 }
        }
      })
      .then(results => {
        this.setState({ userRoster: results.data });
      });
  };

  render() {
    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="col-md-9">
          <h3>User Management</h3>
          {<h3>CSV Upload</h3>}
          {/* Filter by criteria, like name */}
          <UserRoster
            {...this.props}
            userRoster={this.state.userRoster}
            loadUserRoster={this.loadUserRoster}
            heading="Global user roster"
            noCourse
          />
          {/* Have easy +course button */}
        </div>
      </div>
    );
  }
}

export default AdminUsers;
