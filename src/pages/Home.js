import React, {Component} from 'react'

import FileUploader from '../containers/FileUploader'

import Converter from '../classes/Converter'

class Home extends Component {
  state = {
    error: null
  }

  convert = (e) => {
    let converter = new Converter()
    let promise = converter.convert(e.target.files[0])
    promise
    .then(() => {
      this.setState({
        error: null
      })
    })
    .catch(e => {
      console.log(e)
      this.setState({
        error: "Something appears to be wrong with the uploaded file."
      })
    })
  }

  render = () => (
    <div>
      <h1>Welcome to the TBX v3 DCA &lt;-&gt; DCT converter!</h1>
      <p>This converter allows you to convert valid TBX files between DCA and DCT.</p>
      <div>Important Notes:
        <ul>
          <li>This converter is only for TBX v3 files.</li>
          <li>At the moment, this converter only works on Public dialects*</li>
        </ul>
      </div>
      <p>*TBX-Core, TBX-Min, TBX-Basic</p>

      <FileUploader
        onUpload={this.convert}
        caller={this}
       />

       <p style={{color: "red"}}>{this.state.error}</p>
    </div>
  )
}

export default Home
