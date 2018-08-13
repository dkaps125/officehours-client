import React from "react";

class AvailableTas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numTas: 0,
      availabletas: []
    };
  }

  componentDidMount() {
    const socket = this.props.client.get("socket");
    socket.on("availabletas updated", this.getAvailableTAs);
    this.getAvailableTAs();
  }

  componentWillUnmount() {
    const socket = this.props.client.get("socket");
    socket.removeListener("availabletas updated", this.getAvailableTAs);
  }

  getAvailableTAs = () => {
    const { client, course } = this.props;
    client
      .service('/availabletas')
      .find({ query: { course: course._id } })
      .then(tas => {
        this.setState({ numTas: tas.total, availabletas: tas.data });
      })
      .catch(err => {
        console.error('Error while fetching available TAs', err);
      })
  };

  render() {
    return (
      <div>
        {!this.props.hideCount && (
          <div>
            <p className="lead">
              Available TAs:
              <strong> {this.state.numTas}</strong>
            </p>
            <hr />
          </div>
        )}
        <div className="panel panel-primary">
          <div className="panel-heading">TAs hosting office hours</div>
          <table className="table">
            <tbody>
              {this.state.numTas === 0 ? (
                <tr>
                  <td>
                    <small className="text-muted">No TAs are currently hosting office hours</small>
                  </td>
                </tr>
              ) : (
                this.state.availabletas.map((ta, row) => {
                  return (
                    <tr key={row}>
                      <td>{ta.name || ta.directoryID}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default AvailableTas;
