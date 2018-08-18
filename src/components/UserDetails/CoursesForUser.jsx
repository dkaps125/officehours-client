import React from 'react';
import { courseForId } from '../../Utils/';

const CoursesForUser = ({ queriedUser, allCourses }) => (
  <table className="table table-condensed">
    <thead>
      <tr className="active">
        <th>Course</th>
        <th>Privilege</th>
        <th>Total tickets</th>
      </tr>
    </thead>
    <tbody>
      {console.log('qu', queriedUser, allCourses)}
      {queriedUser &&
        queriedUser.roles &&
        queriedUser.roles.map(role => (
          <tr key={role._id}>
            <td>{courseForId(allCourses, role.course).courseid}</td>
            <td>{role.privilege}</td>
            <td>{role.totalTickets}</td>
          </tr>
        ))}
    </tbody>
  </table>
);

export default CoursesForUser;
