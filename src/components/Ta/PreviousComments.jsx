import React from 'react';
// To get modals working
import $ from 'jquery';
window.jQuery = window.$ = $;
require('bootstrap');

class PreviousComments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      prevTickets: []
    };
  }

  componentDidMount() {
    if (this.props.ticket) {
      this.getPreviousTickets();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.ticket && !prevProps.ticket) {
      this.getPreviousTickets();
    } else if (this.props.ticket && prevProps.ticket && this.props.ticket._id !== prevProps.ticket._id) {
      this.getPreviousTickets();
    } else if (!this.props.ticket && !!prevProps.ticket) {
      this.setState({ prevTickets: null });
    }
  }

  getPreviousTickets() {
    const { ticket, client, course } = this.props;

    client
      .service('/tokens')
      .find({
        query: {
          $limit: 10,
          fulfilled: true,
          isBeingHelped: false,
          cancelledByStudent: false,
          course: course._id,
          $sort: {
            createdAt: -1
          }
        }
      })
      .then(tokens => {
        const prevTickets = tokens.data;
        prevTickets.map((ticket, i) => {
          prevTickets[i].comment = this.generateComment(ticket.comment);
          return ticket;
        });
        this.setState({ prevTickets });
      })
      .catch(console.error);
  }

  // dirty TODO: fix eventually
  enablePopover = e => {
    $('[data-toggle=popover]').popover({ trigger: 'hover' });
  };

  // TODO: there's definitely a better way to generate this
  generateComment = comment => {
    if (!comment) {
      return '';
    }

    var result = '';
    if (comment.text) {
      result += comment.text + ' ';
    }

    if (comment.knowledgeable !== 'Not sure' && comment.toldTooMuch !== 'Not sure') {
      result += '[From questionnaire]: ';
    }
    if (comment.knowledgeable === 'Yes') {
      result += 'Student seemed knowledgeable';
      if (comment.toldTooMuch !== 'Not sure') {
        result += ' -- ';
      }
    } else if (comment.knowledgeable === 'No') {
      result += 'Student did not seem knowledgeable';
      if (comment.toldTooMuch !== 'Not sure') {
        result += ' -- ';
      }
    }

    if (comment.toldTooMuch === 'Yes') {
      result += 'Student may have been able to solve problem with less TA help';
    } else if (comment.toldTooMuch === 'No') {
      result += 'Student probably needed TA help to solve problem';
    }

    return result;
  };

  render() {
    const { ticket: curTicket } = this.props;
    return (
      <div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Closed date</th>
              <th>TA</th>
              <th>Description</th>
              <th>TA Comments</th>
            </tr>
          </thead>
          <tbody>
            {this.state.prevTickets.length === 0 ? (
              <tr>
                <td>
                  <p style={{ color: 'gray' }}>No tickets for {curTicket.userName}</p>
                </td>
              </tr>
            ) : (
              this.state.prevTickets.map((ticket, row) => {
                return (
                  <tr key={row}>
                    <td>{row + 1}</td>
                    <td>
                      <small>{new Date(ticket.closedAt).toLocaleString()}</small>
                    </td>
                    <td>
                      <small>{ticket.fulfilledByName || 'N/A'}</small>
                    </td>
                    <td>
                      {ticket.desc && ticket.desc.length > 60 ? (
                        <small
                          title={'Full description for #' + (row + 1)}
                          data-placement="bottom"
                          data-toggle="popover"
                          data-html="true"
                          data-content={ticket.desc}
                          onMouseEnter={this.enablePopover}
                        >
                          {ticket.desc.trunc(60, true)}
                        </small>
                      ) : (
                        <small>{ticket.desc || 'No desc'}</small>
                      )}
                    </td>
                    <td>
                      {ticket.comment && ticket.comment.length > 60 ? (
                        <small
                          title={'All feedback for #' + (row + 1)}
                          data-placement="bottom"
                          data-toggle="popover"
                          data-html="true"
                          data-content={ticket.comment}
                          onMouseEnter={this.enablePopover}
                        >
                          {ticket.comment.trunc(60, true)}
                        </small>
                      ) : (
                        <small>{ticket.comment || 'No comments'}</small>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default PreviousComments;
