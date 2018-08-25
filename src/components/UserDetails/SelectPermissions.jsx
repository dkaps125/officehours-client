import React from 'react';
import toastr from 'toastr';
import { courseForId, idForSoftCourseId, roleForUserDbId } from '../../Utils/';

const permissions = ['course_create', 'course_mod', 'user_create', 'user_mod', 'user_delete', 'user_view', 'admin'];

//const AddToCourse = ({ queriedUser, allCourses, addToCourse }) => (
class SelectPermissions extends React.Component {
  constructor(props) {
    super(props);
    const { queriedUser: user } = this.props;
    this.state = {};

    // init all possible permissions
    permissions.map(permission => {
      this.state[permission] = false;
    });

    if (user && user.permissions) {
      user.permissions.map(permission => {
        this.state[permission] = true;
      });
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

  setPermissions = event => {
    event.preventDefault();

    const { client, queriedUser: user } = this.props;
    let permissions = Object.keys(this.state).filter(k => !!this.state[k]);

    client
      .service('/users')
      .patch(user._id, {
        $set: {
          permissions
        }
      })
      .then(res => {
        toastr.success('Successfully set permissions');
        this.props.updateUser();
      })
      .catch(err => {
        toastr.error('Could not set permissions');
        console.error(err);
      });
  };

  render() {
    if (!this.props.user || !this.props.queriedUser) {
      return <div />;
    }

    const isThisMe = this.props.user._id === this.props.queriedUser._id;

    return (
      <div>
        <form className="form">
          {isThisMe && (
            <div className="alert alert-warning">Warning: Be cautious when changing permissions for yourself</div>
          )}
          {permissions.map(permission => (
            <div className="checkbox" key={permission}>
              <label>
                <input
                  type="checkbox"
                  id={permission + '_checkbox'}
                  name={permission}
                  onChange={this.handleInputChange}
                  checked={this.state[permission]}
                />
                {permission}
              </label>
            </div>
          ))}
          <button onClick={this.setPermissions} className="btn btn-warning">
            Update permissions
          </button>
        </form>
      </div>
    );
  }
}

export default SelectPermissions;
