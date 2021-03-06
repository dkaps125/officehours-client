import React from 'react';
import toastr from 'toastr';
import { __API } from '../../api/UserStore';

class CSVUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleFileUpload = event => {
    event.preventDefault();
    const { api } = this.props;

    var form = new FormData();
    form.append('userfile', this.csvFile.files[0]);
    fetch(`${api}/csvUpload`, {
      method: 'POST',
      body: form,
      headers: {
        Authorization: this.props.client.get('jwt')
      }
    })
      .then(res => {
        return res.json();
      })
      .then(body => {
        console.log(body);
        if (body && body.status === 'success') {
          toastr.success('CSV Processed');
          if (this.props.loadUserRoster) {
            this.props.loadUserRoster();
          }
        } else {
          toastr.error('Encountered an issue while processing CSV')
        }
      })
      .catch((err) => {
        console.log('CSVUpload', err);
        toastr.error('Encountered an issue while processing CSV')
      });
  };

  render() {
    //<form action="" method="post" encType="multipart/form-data" id="js-upload-form" accept=".csv">
    return (
      <div>
        <a href={`${__API}/example.csv`} target="_self">Download example CSV file</a>
        <p>
          Upload a CSV, must be comma separated. Names cannot contain commas.
          <br />
          Only include columns:
          <strong>name,directoryID,course,role</strong> &nbsp;
          where course is the course id (e.g. CMSC123) and role is either "Instructor", "Student", or "TA".
        </p>
        <br />
        <form onSubmit={this.handleFileUpload}>
          <div className="form-inline">
            <div className="form-group">
              <input
                ref={ref => {
                  this.csvFile = ref;
                }}
                type="file"
                name="files[]"
              />
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-sm btn-primary">
                Upload CSV
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default CSVUpload;
