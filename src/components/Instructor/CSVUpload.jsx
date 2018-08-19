import React from 'react';

class CSVUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleFileUpload = event => {
    event.preventDefault();
    var form = new FormData();
    form.append('userfile', this.csvFile.files[0]);
    fetch('http://localhost:3030/csvUpload', {
      method: 'POST',
      body: form,
      headers: {
        Authorization: this.props.client.get('jwt')
      }
    })
      .then(res => {
        console.log(res);
        return res.json();
      })
      .then(body => {
        console.log(body);
      })
      .catch(console.error);
  };

  render() {
    //<form action="" method="post" encType="multipart/form-data" id="js-upload-form" accept=".csv">
    return (
      <div>
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
