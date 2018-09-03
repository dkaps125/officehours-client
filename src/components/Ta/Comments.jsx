import React from "react";
import PreviousComments from "./PreviousComments.jsx";

// TODO: greg refactor
class Comments extends React.Component {
  constructor(props) {
    super(props);
    // gets passed straight to the service
    this.state = {
      knowledgeable: "Not sure",
      toldTooMuch: "Not sure",
      text: "",
      showAlertTimeout: true
    };
  }

  componentWillUnmount() {
    if (!!this.state.tooMuchTimeTimeout) {
      clearTimeout(this.state.tooMuchTimeTimeout);
    }
    this._ismounted = false;
  }

  componentDidMount() {
    if (!!this.props.ticket) {
      this.setShowWarningTimeout();
    }
    this._ismounted = true;
  }

  componentDidUpdate(oldProps, oldState) {
    const { ticket } = this.props;
    if (!oldProps.ticket && !!this.props.ticket) {
      this.setState({
        student: ticket.user._id,
        ticket: ticket._id
      });
      this.setShowWarningTimeout();
    }
  }

  setShowWarningTimeout = () => {
    const taAlertTimeoutMinutes = 10;

    const alertTime = this.addMinutes(new Date(this.props.ticket.dequeuedAt), taAlertTimeoutMinutes);
    const nowTime = new Date();

    if (alertTime > nowTime) {
      this.setState({
        showAlertTimeout: false,
        tooMuchTimeTimeout: setTimeout(() => {
          if (this._ismounted) {
            this.setState({ showAlertTimeout: true });
          }
        }, alertTime - nowTime)
      });
    }
  };

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  closeTicket = event => {
    const { ticket, closeTicket, course } = this.props;
    closeTicket({
      ...this.state,
      course: course._id,
      student: ticket.user._id,
      ticket: ticket._id
    });
  };

  render() {
    const { ticket, course } = this.props;
    // https://stackoverflow.com/questions/1199352/smart-way-to-shorten-long-strings-with-javascript
    // eslint-disable-next-line
    String.prototype.trunc = function(n, useWordBoundary) {
      if (this.length <= n) {
        return this;
      }
      var subString = this.substr(0, n - 1);
      return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(" ")) : subString) + "...";

    };

    return ticket ? (
      <div className="panel panel-default">
        <div className="panel-heading">Current Student</div>
        <div className="panel-body">
          <h4>Assisting: {ticket.user.name}</h4>
          <p style={{ color: "gray" }}>
            Ticket created
            {" " + new Date(ticket.createdAt).toLocaleString()}
          </p>
          {this.state.showAlertTimeout && (
            <h3 style={{ paddingBottom: "15px" }}>
              <span className="label label-warning">
                Warning: You have spent over 10 minutes assisting this student
              </span>
            </h3>
          )}
          <label>Student's issue:</label>
          <div className="well">
            <p>{ticket.desc || "No description"}</p>
          </div>
          <form id="student-notes-form">
            <div className="form-group">
              <label>Did the student seem to know what they were doing?</label>
              <div className="radio">
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="Yes"
                    name="knowledgeable"
                    onChange={this.handleInputChange}
                    checked={this.state.knowledgeable === "Yes"}
                  />{" "}
                  Yes
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="No"
                    name="knowledgeable"
                    onChange={this.handleInputChange}
                    checked={this.state.knowledgeable === "No"}
                  />{" "}
                  No
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="Not sure"
                    name="knowledgeable"
                    onChange={this.handleInputChange}
                    checked={this.state.knowledgeable === "Not sure"}
                  />{" "}
                  Not sure
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Do you think the student could have still solved the problem with less help?</label>
              <div className="radio">
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="Yes"
                    name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "Yes"}
                  />{" "}
                  Yes
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="No"
                    name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "No"}
                  />{" "}
                  No
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    value="Not sure"
                    name="toldTooMuch"
                    onChange={this.handleInputChange}
                    checked={this.state.toldTooMuch === "Not sure"}
                  />{" "}
                  Not sure
                </label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="student-notes-box">Comments</label>
              <textarea
                className="form-control"
                rows="4"
                onChange={this.handleInputChange}
                name="text"
                placeholder="Briefly, what did you assist the student with."
              />
            </div>
          </form>
          <button id="close-ticket-btn" type="submit" onClick={this.closeTicket} className="btn btn-default">
            Close ticket
          </button>
          <button
            id="noshow-btn"
            type="submit"
            onClick={this.props.markNoshow}
            className="btn btn-default"
            style={{ display: "inline", marginLeft: "10px" }}
          >
            No show
          </button>
          <hr />
          <h4>{ticket.user.name + "'s previous comments"}</h4>

          <PreviousComments {...this.props} ticket={ticket} />
        </div>
      </div>
    ) : (
      <h2>No ticket selected</h2>
    );
  }
}

export default Comments;
