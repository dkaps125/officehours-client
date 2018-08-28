import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import TicketDescModal from './TicketDescModal.jsx';

class TicketHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tickets: [],
      itemsPerPage: 20,
      pagesLoaded: [],
      hasMoreTickets: true,
      modalVisible: false,
      sortOrder: -1,
      searchQuery: undefined
    };
  }

  componentDidMount() {
    this.updateTicketList(this.props, 0);
  }

  componentDidUpdate(prevProps) {
    const { course: newCourse } = this.props;
    const { course: oldCourse } = this.props;

    if (newCourse && !oldCourse) {
      this.updateTicketList(0);
    } else if (newCourse && oldCourse && newCourse._id != oldCourse._id) {
      this.updateTicketList(0);
    }
  }

  updateTicketList = page => {
    const { props } = this;

    if (!props || !props.client) {
      return;
    }
    page = !page ? 0 : page;

    const client = props.client;
    var q = {};

    /*
    if (tokenQuery.length === 0) {
      q = {
        query: {
          $limit: itemsPerPage,
          $skip: page * itemsPerPage,
          $sort: {
            createdAt: -1
          }
        }
      };
    } else {
      q = {
        query: {
          $limit: itemsPerPage,
          $skip: page * itemsPerPage,
          $sort: {
            createdAt: -1
          },
          $or: tokenQuery
        }
      }
    }
    */
    q = {
      query: {
        $limit: this.state.itemsPerPage,
        $skip: page * this.state.itemsPerPage,
        $sort: {
          createdAt: -1
        }
      }
    };

    if (!!this.state.searchQuery) {
      q.query.$or = [
        { fulfilledByName: { $search: this.state.searchQuery } },
        { desc: { $search: this.state.searchQuery } }
      ];
    }

    if (props.course) {
      q.query.course = this.props.course._id;
    }

    client
      .service('/tokens')
      .find(q)
      .then(tickets => {
        if (tickets.data.length < this.state.itemsPerPage) {
          this.setState({ hasMoreTickets: false });
        }

        this.setState({ tickets: this.state.tickets.concat(tickets.data) });
      });
  };

  showTicket(selectedTicket) {
    this.setState({ selectedTicket });
    this.handleShowModal();
  }

  handleHideModal = () => {
    this.setState({ modalVisible: false });
  };

  handleShowModal = () => {
    this.setState({ modalVisible: true });
  };

  sortTable = byColumn => {
    var sortColumn;

    if (byColumn === 0) {
      sortColumn = 'curStatus';
    } else if (byColumn === 2) {
      sortColumn = 'createdAt';
    } else if (byColumn === 3) {
      sortColumn = 'fulfilledByName';
    }

    const compare = (a, b) => {
      if (!!sortColumn) {
        if (a[sortColumn] < b[sortColumn]) return this.state.sortOrder;
        else return -this.state.sortOrder;
      } else {
        if (a.user.name < b.user.name) return this.state.sortOrder;
        else return -this.state.sortOrder;
      }
    };

    this.setState({
      tickets: this.state.tickets.sort(compare),
      sortOrder: -this.state.sortOrder
    });
  };

  searchTable = queryEvent => {
    const query = queryEvent.target.value.toLowerCase();
    var searchQuery = undefined;

    if (query !== '') {
      searchQuery = query;
    }

    this.setState(
      {
        searchQuery: searchQuery,
        tickets: []
      },
      () => {
        this.updateTicketList(this.props, 0);
      }
    );
  };

  render() {
    return (
      <div>
        <h3>Ticket history ({this.state.tickets.length})</h3>
        <form className="form-inline" style={{ float: 'right', marginBottom: '5px' }}>
          <input type="text" className="form-control" onKeyUp={this.searchTable} placeholder="Search..." />
        </form>
        <InfiniteScroll
          pageStart={0}
          loadMore={this.updateTicketList}
          hasMore={this.state.hasMoreTickets}
          loader={
            <div className="loader" key={1000000}>
              Loading tickets...
            </div>
          }
        >
          <table id="ticket-list" className="table" key={0}>
            <tbody>
              <tr key={0} className="active">
                <th>#</th>
                <th
                  onClick={() => {
                    this.sortTable(0);
                  }}
                >
                  Status
                </th>
                <th
                  onClick={() => {
                    this.sortTable(1);
                  }}
                >
                  Student
                </th>
                <th
                  onClick={() => {
                    this.sortTable(2);
                  }}
                >
                  Date
                </th>
                <th
                  onClick={() => {
                    this.sortTable(3);
                  }}
                >
                  TA
                </th>
                <th>Description</th>
              </tr>
              {this.state.studentsInQueue === 0 ? (
                <tr key={'nothing'}>
                  <td>
                    <p style={{ color: 'gray' }}>No tickets</p>
                  </td>
                </tr>
              ) : (
                this.state.tickets.map((ticket, row) => {
                  if (ticket.isClosed) {
                    if (ticket.noShow) {
                      ticket.curStatus = 'No-Show';
                    } else if (ticket.cancelledByTA) {
                      ticket.curStatus = 'Canceled (TA)';
                    } else {
                      ticket.curStatus = 'Closed';
                    }
                  } else {
                    if (!ticket.fulfilled) {
                      ticket.curStatus = 'Queued';
                    } else if (!ticket.cancelledByStudent) {
                      ticket.curStatus = 'In Progress';
                    } else {
                      ticket.curStatus = 'Canceled';
                    }
                  }

                  return (
                    <tr
                      id={'ticket-' + row}
                      key={ticket._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        this.showTicket(ticket);
                      }}
                    >
                      <td>{row + 1}</td>
                      <td>{ticket.curStatus}</td>
                      <td>{ticket.user.name || ticket.user.directoryID}</td>
                      <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                      <td>{ticket.fulfilledByName || ''}</td>
                      <td className="col-xs-4">{ticket.desc || 'No description'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </InfiniteScroll>
        <TicketDescModal
          ticket={this.state.selectedTicket}
          visible={this.state.modalVisible}
          handleHideModal={this.handleHideModal}
        />
      </div>
    );
  }
}

export default TicketHistory;
