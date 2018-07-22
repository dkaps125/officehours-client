import React from "react";
import { genUserElt, precisionRoundDecimals, millisToTime, formatTime } from "../../Utils";
import toastr from "toastr";

class StudentStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topStudents: [],
      topTas: [],
      numTas: -1,
      numTicketsToday: -1,
      numTicketsThisWeek: -1,
      numTicketsTotal: -1,
      waitAvg: -1,
      sessAvg: -1,
      taSessionsPerWeek: -1
    };
  }

  componentDidMount() {
    this.updateStats();
  }

  componentDidUpdate(prevProps, prevState) {}

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  };

  // this is a monster
  updateStats = () => {
    const lastMidnight = new Date();
    lastMidnight.setHours(0, 0, 0, 0);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const { client, course } = this.props;

    client
      .service("tokens")
      .find({
        query: {
          _aggregate: [
            {
              $match: {
                noShow: false,
                cancelledByTA: false,
                cancelledByStudent: false,
                fulfilled: true,
                isBeingHelped: false,
                course: course._id
              }
            },
            {
              $group: {
                _id: null,
                waitAvg: { $avg: { $subtract: ["$dequeuedAt", "$createdAt"] } },
                sessAvg: { $avg: { $subtract: ["$closedAt", "$dequeuedAt"] } }
              }
            }
          ]
        }
      })
      .then(toks => {
        if (toks.length > 0) {
          //$("#stats-wait-avg").html(millisToTime(toks[0].waitAvg));
          //$("#minutes-session").html(millisToTime(toks[0].sessAvg));
          this.setState({ waitAvg: millisToTime(toks[0].waitAvg) });
          this.setState({ sessAvg: millisToTime(toks[0].sessAvg) });
        }
        return client.service("/tokens").find({
          query: {
            _aggregate: [
              {
                $match: {
                  noShow: false,
                  cancelledByTA: false,
                  cancelledByStudent: false,
                  fulfilled: true,
                  isBeingHelped: false,
                  course: course._id
                }
              },
              {
                $project: {
                  year: { $year: "$createdAt" },
                  week: { $week: "$createdAt" }
                }
              },
              {
                $group: {
                  _id: { year: "$year", week: "$week" },
                  total: { $sum: 1 }
                }
              },
              {
                $group: {
                  _id: null,
                  avgTotal: { $avg: "$total" }
                }
              }
            ]
          }
        });
      })
      .then(res => {
        const taSessionsPerWeek = precisionRoundDecimals((res[0] && res[0].avgTotal) || 0);
        this.setState({ taSessionsPerWeek });
        return client.service("users").find({
          query: {
            $or: [{ role: "Instructor" }, { role: "TA" }],
            $limit: 0
          }
        });
      })
      .then(res => {
        this.setState({ numTas: res.total });

        return client.service("/tokens").find({
          query: {
            createdAt: {
              $gt: lastMidnight.getTime()
            },
            $limit: 0,
            course: course._id
          }
        });
      })
      .then(res => {
        this.setState({ numTicketsToday: res.total });
        return client.service("/tokens").find({
          query: {
            createdAt: {
              $gt: lastWeek.getTime()
            },
            $limit: 0,
            course: course._id
          }
        });
      })
      .then(res => {
        this.setState({ numTicketsThisWeek: res.total });
        return client.service("/tokens").find({
          query: {
            $limit: 0,
            course: course._id
          }
        });
      })
      .then(res => {
        this.setState({ numTicketsTotal: res.total });
        // Top students
        return client.service("users").find({
          query: {
            totalTickets: {
              $gt: 0
            },
            $sort: {
              totalTickets: -1
            },
            $limit: 10,
            role: "Student",
            course: course._id
          }
        });
      })
      .then(res => {
        var allPromises = [];
        for (var i = 0; i < res.data.length; i++) {
          const user = res.data[i];
          var getAvgTicketsWeek = client.service("/tokens").find({
            query: {
              _aggregate: [
                {
                  $match: {
                    fulfilledBy: user._id,
                    fulfilled: true,
                    isBeingHelped: false,
                    course: course._id
                  }
                },
                {
                  $project: {
                    year: { $year: "$createdAt" },
                    week: { $week: "$createdAt" }
                  }
                },
                {
                  $group: {
                    _id: { year: "$year", week: "$week", fulfilledBy: "$fulfilledBy" },
                    total: { $sum: 1 }
                  }
                },
                {
                  $group: {
                    _id: null,
                    avgTotal: { $avg: "$total" }
                  }
                }
              ]
            }
          });
          var getLastToken = client.service("/tokens").find({
            query: {
              fulfilledBy: user._id,
              $limit: 1,
              $sort: {
                closedAt: -1
              },
              course: course._id
            }
          });
          allPromises.push(Promise.all([getAvgTicketsWeek, getLastToken]));
        }

        // force order
        Promise.all(allPromises).then(allResults => {
          var topStudents = [];
          for (var i = 0; i < allResults.length; i++) {
            const user = res.data[i];
            const name = genUserElt(user, user.name);
            const totalTickets = user.totalTickets;
            const getAvgTicketsWeek = allResults[i][0];
            const getLastToken = allResults[i][1];
            const avgTicketsWeek =
              getAvgTicketsWeek.length > 0 ? precisionRoundDecimals(getAvgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
            const lastTicketDate = getLastToken.total >= 1 ? formatTime(getLastToken.data[0].closedAt) : "N/A";
            topStudents[i] = { user, name, totalTickets, avgTicketsWeek, lastTicketDate };
          }
          this.setState({ topStudents });
        });

        return client.service("users").find({
          query: {
            totalTickets: {
              $gt: 0
            },
            $sort: {
              totalTickets: -1
            },
            $limit: 10,
            $or: [{ role: "TA" }, { role: "Instructor" }]
          }
        });
      })
      .then(res => {
        var allPromises = [];
        for (var i = 0; i < res.data.length; i++) {
          const user = res.data[i];
          var getAvgTicketsWeek = client.service("/tokens").find({
            query: {
              _aggregate: [
                {
                  $match: {
                    fulfilledBy: user._id,
                    fulfilled: true,
                    isBeingHelped: false,
                    course: course._id
                  }
                },
                {
                  $project: {
                    year: { $year: "$createdAt" },
                    week: { $week: "$createdAt" }
                  }
                },
                {
                  $group: {
                    _id: { year: "$year", week: "$week", fulfilledBy: "$fulfilledBy" },
                    total: { $sum: 1 }
                  }
                },
                {
                  $group: {
                    _id: null,
                    avgTotal: { $avg: "$total" }
                  }
                }
              ]
            }
          });
          var getLastToken = client.service("/tokens").find({
            query: {
              fulfilledBy: user._id,
              $limit: 1,
              $sort: {
                closedAt: -1
              },
              course: course._id
            }
          });
          allPromises.push(Promise.all([getAvgTicketsWeek, getLastToken]));
        }

        // force order
        Promise.all(allPromises).then(allResults => {
          var topTas = [];
          for (var i = 0; i < allResults.length; i++) {
            const user = res.data[i];
            const name = genUserElt(user, user.name);
            const totalTickets = user.totalTickets;
            const getAvgTicketsWeek = allResults[i][0];
            const getLastToken = allResults[i][1];
            const avgTicketsWeek =
              getAvgTicketsWeek.length > 0 ? precisionRoundDecimals(getAvgTicketsWeek[0].avgTotal, 3) || "N/A" : "N/A";
            const lastTicketDate = getLastToken.total >= 1 ? formatTime(getLastToken.data[0].closedAt) : "N/A";
            topTas[i] = { user, name, totalTickets, avgTicketsWeek, lastTicketDate };
          }
          this.setState({ topTas });
        });
      })
      .catch(console.error);
  };

  updateQueueCount = () => {
    const { course, client } = this.props;
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
        this.setState({ studentsInQueue: tickets.total });
      })
      .catch(console.error);
  };

  render() {
    return (
      <div>
        <h3>Student statistics</h3>
        <div className="well stats">
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.numTicketsTotal >= 0 ? this.state.numTicketsTotal : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Tickets (total)</p>
            </div>
          </div>
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.numTicketsThisWeek >= 0 ? this.state.numTicketsThisWeek : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Tickets (1 week)</p>
            </div>
          </div>
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.numTicketsToday >= 0 ? this.state.numTicketsToday : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Tickets (today)</p>
            </div>
          </div>
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.waitAvg >= 0 ? this.state.waitAvg : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Avg Wait (mins)</p>
            </div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr className="active">
              <th>Name</th>
              <th>Total tickets</th>
              <th>Avg tickets/week</th>
              <th>Last ticket date</th>
            </tr>
          </thead>
          <tbody>
            {this.state.topStudents.length > 0 ? (
              this.state.topStudents.map((student, row) => {
                return (
                  <tr key={row}>
                    <td>{student.name}</td>
                    <td>{student.totalTickets}</td>
                    <td>{student.avgTicketsWeek}</td>
                    <td>{student.lastTicketDate}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td style={{ color: "gray" }}>No statistics</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr />
        <h3>TA Statistics</h3>
        <div className="well stats">
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.numTas >= 0 ? this.state.numTas : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">TA's & Instr's</p>
            </div>
          </div>
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.sessAvg >= 0 ? this.state.sessAvg : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Mins/session</p>
            </div>
          </div>
          <div className="statsBlock">
            <div className="statsPanel">
              <div>{this.state.taSessionsPerWeek >= 0 ? this.state.taSessionsPerWeek : <span>N/A</span>}</div>
            </div>
            <div className="statsFooter">
              <p className="statsText lead">Sessions/week</p>
            </div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr className="active">
              <th>Name</th>
              <th>Total tickets</th>
              <th>Avg tickets/week</th>
              <th>Last closed ticket</th>
            </tr>
          </thead>
          <tbody>
            {this.state.topTas.length > 0 ? (
              this.state.topTas.map((ta, row) => {
                return (
                  <tr key={row}>
                    <td>{ta.name}</td>
                    <td>{ta.totalTickets}</td>
                    <td>{ta.avgTicketsWeek}</td>
                    <td>{ta.lastTicketDate}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td style={{ color: "gray" }}>No statistics</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default StudentStats;
