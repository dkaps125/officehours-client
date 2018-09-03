import React from 'react';
import toastr from 'toastr';

// TODO: greg refactor
class QueuedStudentsTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentsInQueue: 0,
      studentQueue: []
    };
  }

  componentDidMount() {
    const { course } = this.props;
    if (course) {
      this.updateStudentQueue();
      this.addListener(course);
    }
  }

  componentDidUpdate(prevProps) {
    const { course: newCourse, client } = this.props;
    const { course: oldCourse } = prevProps;

    // if we switched courses, remove old listeners
    if (oldCourse && (!newCourse || newCourse._id !== oldCourse._id)) {
      this.removeListener(oldCourse);
    }

    if (newCourse && (!oldCourse || oldCourse._id !== newCourse._id)) {
      this.addListener(newCourse);
    }
  }

  componentWillUnmount() {
    const { course } = this.props;

    if (course) {
      this.removeListener(course);
    }
  }

  ticketCreated = () => {
    this.updateStudentQueue();
    toastr.success('New ticket created');
  };

  ticketPatched = () => {
    this.updateStudentQueue();
    toastr.success('Ticket status updated');
  };

  addListener = course => {
    const { client } = this.props;

    const socket = client.get('socket');
    socket.on(`ticket update ${this.props.course._id}`, this.ticketPatched);
    socket.on(`ticket create ${this.props.course._id}`, this.ticketCreated);
  };

  removeListener = course => {
    const { client } = this.props;

    const socket = client.get('socket');
    socket.removeListener(`ticket update ${this.props.course._id}`, this.ticketPatched);
    socket.removeListener(`ticket create ${this.props.course._id}`, this.ticketCreated);
  };

  updateStudentQueue = () => {
    const { client, course, queueUpdated } = this.props;
    if (!course) {
      return;
    }

    client
      .service('/tokens')
      .find({
        query: {
          $limit: 100,
          fulfilled: false,
          course: course._id
        }
      })
      .then(tickets => {
        const { data: studentQueue, total: studentsInQueue } = tickets;
        this.setState({
          studentQueue,
          studentsInQueue
        });

        if (queueUpdated) {
          queueUpdated(studentQueue, studentsInQueue);
        }
      }).catch(err => {
        console.error('Cannot get tickets');
        console.error(err);
      })
  };

  render() {
    return (
      <table className="table">
        <tbody>
          <tr className="active">
            <th>Num</th>
            <th>Student</th>
            <th>Description</th>
            <th>Date submitted</th>
          </tr>
          {this.state.studentsInQueue === 0 ? (
            <tr>
              <td>
                <p style={{ color: 'gray' }}>No students in queue</p>
              </td>
            </tr>
          ) : (
            this.state.studentQueue.map((ticket, row) => {
              return (
                <tr key={row}>
                  <td>{row + 1}</td>
                  <td>{ticket.user.name || ticket.user.directoryID}</td>
                  <td>{ticket.desc || 'No description'}</td>
                  <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  }
}

export default QueuedStudentsTable;
