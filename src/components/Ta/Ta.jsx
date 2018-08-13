import React from "react";
import AvailableTas from "../AvailableTas";
import QueuedStudentsTable from "../QueuedStudentsTable";
import Comments from "./Comments.jsx";
import toastr from "toastr";
import { roleForUser } from "../../Utils";

const isOnDuty = (user, course) => user.onDuty && user.onDutyCourse === course._id;

class Ta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      onDuty: false,
      numTas: 0,
      studentsInQueue: 0,
      studentQueue: [],
      currentTicket: null,
      onDutyCourse: null
    };
  }

  componentDidMount() {
    const { client, user, course } = this.props;
    const socket = client.get("socket");

    // TODO: if on duty for another course, have msg to change status to this course
    this.setState({ numTas: 1, onDuty: isOnDuty(user, course) });
    this.getCurrentStudent();
    this.updateQueueCount();

    // Don't toast because QueuedStudentsTable toasts for us
    socket.on("tokens created", this.updateQueueCount);
    socket.on("tokens patched", this.updateQueueCount);
  }

  componentWillUnmount() {
    const socket = this.props.client.get("socket");
    socket.removeListener("tokens created", this.updateQueueCount);
    socket.removeListener("tokens patched", this.updateQueueCount);
  }

  componentDidUpdate(prevProps, prevState) {
    // onDuty status updated
    if (!prevState.onDuty && this.state.onDuty) {
      this.setPasscode();
      this.getCurrentStudent();
    } else if (prevState.onDuty && !this.state.onDuty) {
      this.setState({ passcode: null });
    }
  }

  updateQueueCount = () => {
    const { client, course } = this.props;
    client
      .service("/tokens")
      .find({
        query: {
          $limit: 0,
          fulfilled: false,
          course: course._id
        }
      })
      .then(tickets => {
        console.log({ studentsInQueue: tickets.total });
        this.setState({ studentsInQueue: tickets.total });
      })
      .catch(console.error);
  };

  // TODO: make this work
  cancelAllTix = () => {
    console.log("end oh");
  };

  toggleOH = () => {
    const { client, course, user } = this.props;
    const onDuty = !this.state.onDuty;
    client
      .service("/users")
      .patch(user._id, { onDuty, onDutyCourse: course._id })
      .then(newMe => {
        onDuty ? toastr.success("You have joined office hours") : toastr.success("You have left office hours");
        this.setState({ onDuty });
      })
      .catch(err => {
        toastr.error("Cannot change on duty status");
        console.log("Toggle OH error", err);
      });
  };

  getCurrentStudent = () => {
    const { client, course, user } = this.props;
    client
      .service("/tokens")
      .find({
        query: {
          $limit: 1,
          fulfilled: true,
          isBeingHelped: true,
          fulfilledBy: user._id,
          $sort: {
            createdAt: 1
          },
          cancelledByStudent: false,
          course: course._id
        }
      })
      .then(tickets => {
        // Have a current student
        let currentTicket;
        if (tickets.total > 0) {
          currentTicket = tickets.data[0];
        }
        this.setState({ currentTicket });
      });
  };

  dequeueStudent = () => {
    const { client, course } = this.props;
    client
      .service("/dequeue-student")
      .create({course: course._id})
      .then(result => {
        this.getCurrentStudent();
      })
      .catch(err => {
        console.error(err);
      });
  };

  setPasscode = () => {
    const { client, course } = this.props;

    client
      .service("/passcode")
      .get(course._id)
      .then(res => {
        this.setState({ passcode: res.passcode });
      });
  };

  markNoshow = () => {
    const client = this.props.client;
    if (!!this.state.currentTicket && window.confirm("Warning: Marking this student as a no show. Are you sure?")) {
      client
        .service("/tokens")
        .patch(this.state.currentTicket._id, {
          isBeingHelped: false,
          isClosed: true,
          noShow: true,
          closedAt: Date.now()
          // TODO: shouldIgnoreInTokenCount: false/true
        })
        .then(updatedTicket => {
          toastr.success("Student marked as a no-show and ticket closed");
          this.getCurrentStudent();
        })
        .catch(err => {
          toastr.error("Could not mark student as a no-show");
          console.error(err);
        });
    }
  };

  closeTicket = comment => {
    const { client, course, user } = this.props;
    if (!!this.state.currentTicket && window.confirm("Are you sure you want to permanently close this ticket?")) {
      console.log('closing ticket');
      client
        .service("comment")
        .create(comment)
        .then(commentObj => {
          //TODO put this in hook asap
          client
            .service("/users")
            .get(user._id)
            .then(res => {
              var role = roleForUser(res, course);
              // total tix for course
              const tixForCourse = role.totalTickets ? role.totalTickets + 1 : 1;
              // total tix for user
              const totalTickets = res.totalTickets ? role.totalTickets + 1 : 1;
              role.totalTickets = tixForCourse;
              // TODO: patch role properly
              client
                .service("/users")
                .patch(user._id, {
                  totalTickets
                })
                .then(updatedStudent => {
                  console.log(updatedStudent);
                })
                .catch(console.error);
            });
          return client.service("tokens").patch(this.state.currentTicket._id, {
            isBeingHelped: false,
            isClosed: true,
            // TODO: move closedAt and other dates to service hooks
            closedAt: Date.now(),
            comment: commentObj._id
          });
        })
        .then(updatedTicket => {
          toastr.success("Ticket closed and comment successfully saved");
          this.getCurrentStudent();
        })
        .catch(err => {
          toastr.error("Could not close ticket");
          console.error(err);
        });
    }
  };

  render() {
    const { client } = this.props;
    if (!client) {
      return <div>Loading...</div>;
    }
    return (
      <div className="row" style={{ paddingTop: "15px" }}>
        <div className="col-md-3">
          <AvailableTas {...this.props} />
          <hr />
          {this.state.onDuty ? (
            <div className="panel panel-default">
              <div className="panel-heading">You are hosting office hours</div>
              <div className="panel-body">
                <h4>Hourly passcode:</h4>
                <h2 className="passcode">
                  <span className="label label-success">{this.state.passcode}</span>
                </h2>
                <hr />
                <button onClick={this.toggleOH} className="btn btn-default">
                  Leave office hours
                </button>
                <div className="alert alert-success alert-dismissable" role="alert" style={{ marginTop: "15px" }}>
                  <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                  Do not forget to press the leave button before you depart.
                </div>
                <hr />
                <div id="end-oh-area">
                  <h4>End office hours:</h4>
                  <button onClick={this.cancelAllTix} className="btn btn-warning" style={{ marginTop: "10px" }}>
                    Cancel all tickets
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel panel-default">
              <div className="panel-heading">You are not in office hours</div>
              <div className="panel-body">
                <button onClick={this.toggleOH} className="btn btn-default">
                  Join office hours
                </button>
              </div>
            </div>
          )}
          <hr />
        </div>
        <div className="col-md-9">
          <p className="lead">
            Students in queue:&nbsp;
            <strong id="students-in-queue">{this.state.studentsInQueue}</strong>
          </p>
          <hr />
          {this.state.onDuty ? (
            <div>
              {this.state.currentTicket && (
                <Comments
                  ticket={this.state.currentTicket}
                  closeTicket={this.closeTicket}
                  markNoshow={this.markNoshow}
                  {...this.props}
                />
              )}

              <div id="student-queue-area" className="panel panel-default">
                <div className="panel-heading">Student queue</div>
                <div className="panel-body">
                  {this.state.studentsInQueue > 0 && (
                    <button onClick={this.dequeueStudent} className="btn btn-success" style={{ marginBottom: "15px" }}>
                      Dequeue Student
                    </button>
                  )}
                  <QueuedStudentsTable {...this.props} />
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }
}

export default Ta;
