import React from 'react';

class CSVUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };

  }

  handleFileUpload = (event) => {
    event.preventDefault();
    var form = new FormData();
    form.append('userfile', this.csvFile.files[0]);
    fetch('/csvUpload', {
      method: 'POST',
      body: form,
      headers: {
        "Authorization": this.props.client.get('jwt')
      }
    }).then(res => {
      return res.json();
    }).then(body => {
      console.log(body);
    }).catch(console.error);

  }

  render() {
      //<form action="" method="post" encType="multipart/form-data" id="js-upload-form" accept=".csv">
    return <div>
      <a href="example.csv">Download example CSV file</a>
      <p>
        Upload a CSV, must be comma separated. Names cannot contain commas.
        <br />
        Only include columns:
        <strong>name,directoryID,role</strong>
        where role is either "Instructor", "Student", or "TA"
      </p>
      <br />
      <form onSubmit={this.handleFileUpload}>
        <div className="form-inline">
          <div className="form-group">
            <input ref={(ref) => { this.csvFile = ref; }} type="file" name="files[]"></input>
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-sm btn-primary">Upload CSV</button>
          </div>
        </div>
      </form>
    </div>
  }
}

export default CSVUpload;
