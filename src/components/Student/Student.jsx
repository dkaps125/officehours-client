import React from 'react';
import AvailableTas from '../AvailableTas';
import toastr from 'toastr';

class Student extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      studentsInQueue: 0,
      numStudentsAheadOfMe: 0,
      numTokens: 0,
      currentResponder: '',
      curTicketDesc: '',
      hasUnfulfilledTicket: false,
      curReq: {},
      lastTicketCancelled: false
    };
  }

  componentDidMount() {
    const { course } = this.props;
    this.setNumTokens();
    if (course) {
      this.addListener(course);
    }
  }

  componentWillUnmount() {
    this.removeListener(this.props.course);
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

  addListener = course => {
    const { client } = this.props;

    const socket = client.get('socket');
    socket.on(`ticket update ${this.props.course._id}`, this.setNumTokens);
    socket.on(`ticket create ${this.props.course._id}`, this.setNumTokens);
  };

  removeListener = course => {
    const { client } = this.props;

    const socket = client.get('socket');
    socket.removeListener(`ticket update ${this.props.course._id}`, this.setNumTokens);
    socket.removeListener(`ticket create ${this.props.course._id}`, this.setNumTokens);
  };

  setNumTokens = () => {
    const { client, course } = this.props;
    const getNumToks = client.service('/numtokens').get(course._id);
    const getUnfulfilledToks = client.service('/tokens').find({
      query: {
        fulfilled: false,
        $limit: 0,
        course: course._id
      }
    });
    const getQueuePos = client.service('/queue-position').get({});
    const getCurrentTicket = client.service('/tokens').find({
      query: {
        $limit: 1,
        fulfilled: true,
        isBeingHelped: true,
        $sort: {
          createdAt: 1
        },
        course: course._id
      }
    });

    Promise.all([getNumToks, getUnfulfilledToks, getQueuePos, getCurrentTicket])
      .then(res => {
        const numTokens = res[0].tokensRemaining;
        const numUnfulfilledTickets = res[1].total;
        const studentsInQueue = res[2].sizeOfQueue;
        const numStudentsAheadOfMe = res[2].peopleAheadOfMe + 1;
        //const currentTicket = res[3].data.length > 0 ? res[3].data[0] : null;
        if (numUnfulfilledTickets === 0 && this.state.numUnfulfilledTickets > 0 && !this.state.lastTicketCancelled) {
          toastr.success('You have been dequeued by a TA!', { timeout: 15000 });
          //} else if (numUnfulfilledTickets > 0) {
          //this.getCurrentTicket();
        }
        this.getCurrentTicket();
        this.setState({
          numTokens,
          numUnfulfilledTickets,
          studentsInQueue,
          numStudentsAheadOfMe,
          lastTicketCancelled: false
          /*currentTicket*/
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  submitTicket = event => {
    event.preventDefault();

    const { client, course } = this.props;
    const { curReq } = this.state;
    const req = { ...this.state.curReq, course: course._id };

    client
      .service('/tokens')
      .create(req)
      .then(ticket => {
        this.setNumTokens();
        toastr.success('Your help request has been submitted!');
      })
      .catch(err => {
        var errMsg = 'Your help request could not be submitted: ';
        if (this.state.numTokens <= 0) {
          errMsg += 'You are out of tokens.';
        } else {
          errMsg += !!err.message ? err.message + '.' : '';
        }
        toastr.error(errMsg);
      });

    this.setState({ curReq: {} });
  };

  getCurrentTicket = shouldPushNotif => {
    const { client, course } = this.props;

    client
      .service('/tokens')
      .find({
        query: {
          $limit: 1,
          fulfilled: true,
          isBeingHelped: true,
          $sort: {
            createdAt: 1
          },
          course: course._id
        }
      })
      .then(tickets => {
        let currentResponder = '';
        let curTicketDesc = '';
        let currentTicket = null;

        if (tickets.total >= 1 && tickets.data[0].fulfilled) {
          currentTicket = tickets.data[0];

          if (shouldPushNotif) {
            // TODO: push notif
          }
          currentResponder = `${currentTicket.fulfilledByName} is assisting you`;
          curTicketDesc = currentTicket.desc || 'No description provided';
        }

        this.setState({ currentResponder, curTicketDesc, currentTicket });
      })
      .catch(err => {
        console.error(err);
      });
  };

  cancelRequest = () => {
    const { client, course } = this.props;
    client
      .service('/tokens')
      .find({
        query: {
          fulfilled: false,
          course: course._id
        }
      })
      .then(tickets => {
        tickets.data.map(ticket => {
          client
            .service('/tokens')
            .patch(ticket._id, {
              fulfilled: true,
              cancelledByStudent: true
            })
            .then(ticket => {
              this.setState({ lastTicketCancelled: true });
              toastr.warning('Your help ticket has been canceled');
              this.setNumTokens();
            })
            .catch(function(err) {
              console.error('cancelRequest r2', err);
              toastr.error(err.message || 'Cannot cancel ticket');
            });
          return ticket;
        });
      })
      .catch(err => {
        console.error('cancelRequest r1', err);
        toastr.error(err.message || 'Cannot cancel ticket');
      });
  };

  cancelSpecificTicket = ticket => {
    const { client } = this.props;
    client
      .service('/tokens')
      .patch(ticket._id, {
        fulfilled: true,
        cancelledByStudent: true,
        isBeingHelped: false
      })
      .then(ticket => {
        this.setState({ lastTicketCancelled: true });
        toastr.warning('Your help ticket has been canceled');
        this.setNumTokens();
      })
      .catch(err => {
        console.error(err);
        toastr.error(err.message || 'Cannot cancel ticket');
      });
  };

  handleInputChange = event => {
    var curReq = {
      ...this.state.curReq,
      [event.target.name]: event.target.value
    };

    this.setState({ curReq });
  };

  render() {
    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="col-md-3">
          <AvailableTas {...this.props} />
        </div>
        <div className="col-md-8">
          <p className="lead">
            Students in queue:
            <strong id="students-in-queue"> {this.state.studentsInQueue}</strong>
          </p>
          <hr />
          <div className="panel panel-default">
            <div className="panel-heading">Request Office Hours</div>
            <div className="panel-body">
              {this.state.numUnfulfilledTickets === 0 && !this.state.currentTicket ? (
                <div id="ticket-submit-area">
                  <p id="num-tokens">
                    You have <strong>{this.state.numTokens}</strong> tokens remaining.
                  </p>
                  <p>
                    <small>
                      This will add you to the office hours queue and will cost one OH token. If you run out of tokens,
                      you will not be able to receive office hours assistance until regeneration (every 24 hours).
                    </small>
                  </p>
                  <hr />
                  <form onSubmit={this.submitTicket}>
                    <textarea
                      onChange={this.handleInputChange}
                      name="desc"
                      className="form-control"
                      rows="2"
                      placeholder="Briefly describe your issue (max 2 sentences)"
                    />
                    <br />
                    <input
                      onChange={this.handleInputChange}
                      type="text"
                      name="passcode"
                      className="form-control"
                      rows="1"
                      placeholder="Passcode"
                      autoComplete="off"
                    />
                    <br />
                    <div className="alert alert-warning">
                      Make sure your code is checked into the submit server before your session starts.
                    </div>
                    <button id="ticket-button" type="submit" className="btn btn-default">
                      Request help
                    </button>
                  </form>
                </div>
              ) : // No current ticket
              !this.state.currentTicket ? (
                <div id="ticket-no-submit">
                  <h4 id="ticket-queue-msg">You are # {this.state.numStudentsAheadOfMe} in the queue</h4>
                  <button
                    type="button"
                    onClick={this.cancelRequest}
                    className="btn btn-danger"
                    style={{ marginTop: '10px' }}
                  >
                    Cancel request
                  </button>
                </div>
              ) : (
                <div id="current-ticket-area">
                  <h4>{this.state.currentResponder}</h4>
                  <br />
                  <p>Ticket description: </p>
                  <div className="well">
                    <p>{this.state.curTicketDesc}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Student;
