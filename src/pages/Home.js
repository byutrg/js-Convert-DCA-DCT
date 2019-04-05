import React, {Component} from 'react'

import FileUploader from '../containers/FileUploader'

import Converter from '../classes/Converter'

class Home extends Component {
  convert = (e) => {
    let converter = new Converter()
    converter.convert(e.target.files[0])
  }

  render = () => (
    <div>
      <h1>Welcome to the TBX v3 DCA &lt;-&gt; DCT converter!</h1>
      <p>This converter allows you to convert valid TBX files between DCA and DCT.</p>
      <p>Important Notes:
        <ul>
          <li>This converter is only for TBX v3 files.</li>
          <li>At the moment, this converter only works on Public dialects*</li>
        </ul>
      </p>
      <p>*TBX-Core, TBX-Min, TBX-Basic</p>

      <FileUploader
        onUpload={this.convert}
        caller={this}
       />
    </div>
  )
}

export default Home
