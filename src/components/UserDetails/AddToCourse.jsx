import React from 'react';
import { courseForId } from '../../Utils/';

//const AddToCourse = ({ queriedUser, allCourses, addToCourse }) => (
class AddToCourse extends React.Component {
  render() {
    return (
      <div>
        <form className="form form-inline">
          <strong>Add to course:</strong>{' '}
          <input type="text" className="form-control" placeholder="CMSC123" style={{ marginRight: 10 }} />
          <button type="submit" className="btn btn-default">
            Enroll
          </button>
        </form>
      </div>
    );
  }
}

export default AddToCourse;
