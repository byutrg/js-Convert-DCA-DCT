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
      let errorMsg = (e.message === "Dialect not found.") ?
        "Non-Public dialects cannot be converted at this time." :
        "Something appears to be wrong with the uploaded file."
      this.setState({
        error: errorMsg
      })
    })
  }

  render = () => (
    <div>
      <h1>Welcome to the TBX v3 DCA &lt;-&gt; DCT converter!</h1>
      <p>This converter allows you to convert valid TBX files between DCA and DCT.</p>
      <p>Important Notes:</p>
      <ul>
        <li>This converter is only for TBX v3 files.</li>
        <li>At the moment, this converter only works on Public dialects*</li>
      </ul>

      <p>*TBX-Core, TBX-Min, TBX-Basic</p>

      <p>Selected files should be converted and downloaded automatically.</p>
      <FileUploader
        onUpload={this.convert}
        caller={this}
       />

       <p style={{color: "red"}}>{this.state.error}</p>
    </div>
  )
}

export default Home
