import React from 'react';
import toastr from 'toastr';

class CreateCourseWizard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      /*title: '',
      courseid: '',
      //ohURL: '',
      numTokens: 2,
      requiresPasscode: true*/
      semester: {
        term: 'Fall',
        year: 2018
      }
    };

    //const user = props.client.get('user');
    //const socket = props.client.get('socket');
  }

  componentWillUnmount() {
  }

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {

  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (name === 'term') {
      var semester = this.state.semester;
      semester.term = value;
      this.setState({
        semester
      });
    } else if (name === 'year') {
      var semester = this.state.semester;
      semester.year = parseInt(value);
      this.setState({
        semester
      });
    } else {
      this.setState({
        [name]: value
      });
    }
  }

  createCourse = event => {
    event.preventDefault();

    var course = this.state;

    if (!course.title && !!course.courseid) {
      course.title = course.courseid;
    }

    const client = this.props.client;

    client.service('/courses').create(course)
    .then(course => {
      toastr.success("Course successfully created");
      // TODO: redirect to course page
    });

    //this.setState({});
    this.props.history.push('/courses');

  }

  render() {
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-9">
        <h2>Create a course</h2>
        <br />
        <form onSubmit={this.createCourse}>
          <div className="form-group">
            <label htmlFor="courseid">Course id</label>
            <input type="text" className="form-control" id="courseid" name="courseid"
              placeholder="CMSC330" onChange={this.handleInputChange} required/>
          </div>
          <div className="form-group">
            <label htmlFor="title">Course title</label>
            <input type="text" className="form-control" id="title" name="title"
              placeholder="Organization of Pogramming Languages"
              onChange={this.handleInputChange} />
          </div>
          <div className="form-group row">
            <div className="col-md-3">
              <label htmlFor="term">Semester</label>
              <select className="form-control inline" id="numTokens" name="term"
                onChange={this.handleInputChange} value={this.state.semester.term}>
                <option>Spring</option>
                <option>Summer</option>
                <option>Fall</option>
                <option>Winter</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="year">Year</label>
              <select className="form-control" id="numTokens" name="year"
                onChange={this.handleInputChange} value={this.state.semester.year}>
                <option>2018</option>
                <option>2019</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="courseURL">Schedule URL</label>
            <input type="url" className="form-control" id="ohURL" name="ohURL"
              placeholder="http://www.cs.umd.edu/class/spring2018/cmsc330/#officehours"
              onChange={this.handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="numTokens">Tokens per day</label>
            <select className="form-control" id="numTokens" name="numTokens"
              onChange={this.handleInputChange} defaultValue={5}>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
              <option>15</option>
              <option>20</option>
            </select>
          </div>
          <div className="checkbox">
            <label>
              <input type="checkbox" id="requirePasscode" name="requiresPasscode"
                onChange={this.handleInputChange} checked/> Require passcode
            </label>
          </div>

          <button type="submit" className="btn btn-success">Create course</button>

        </form>
      </div>
    </div>
  }
}

export default CreateCourseWizard;
