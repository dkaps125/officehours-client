import React from 'react';
import toastr from 'toastr';

class CreateCourseWizard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      requiresPasscode: false,
      semester: {
        term: 'Fall',
        year: 2018
      }
    };
  }

  componentDidMount() {
    if (this.props.course && this.props.propCourse) {
      this.props.popCourse();
    }
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    let semester;
    if (name === 'term') {
      semester = this.state.semester;
      semester.term = value;
      this.setState({
        semester
      });
    } else if (name === 'year') {
      semester = this.state.semester;
      semester.year = parseInt(value, 10);
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
    const { user } = this.props;

    if (!course.title && !!course.courseid) {
      course.title = course.courseid;
    }

    const client = this.props.client;

    client.service('/courses').create(course)
    .then(course => {
      return client.service('/users').patch(user._id, {
        $push: {
          roles: {
            privilege: 'Instructor',
            course: course._id,
            totalTickets: 0
          },
        }
      })
    })
    .then(user => {
      toastr.success("Course successfully created");
      this.props.setCourse(course, true);

      const newRoute = `${course.courseid}/instructor/`;
      this.props.history.replace(newRoute);
      localStorage.setItem('lastRoute', newRoute);
    })
    .catch(error => {
      toastr.error("Could not create course ", error)
      console.error(error);
    })

    //this.setState({});


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
              value={this.state.ohURL}
              onChange={this.handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="dailyTokens">Tokens per day</label>
            <select className="form-control" id="dailyTokens" name="dailyTokens"
              value={this.state.dailyTokens}
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
                onChange={this.handleInputChange} checked={this.state.requiresPasscode}/> Require passcode
            </label>
          </div>

          <button type="submit" className="btn btn-success">Create course</button>

        </form>
      </div>
    </div>
  }
}

export default CreateCourseWizard;
