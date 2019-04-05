import React, {Component} from 'react'

class FileUploader extends Component {
  render = () => (
    <div>
      <input
        type="file"
        onChange={this.props.onUpload}
        accept={'.tbx, .xml'} />
    </div>
  )
}

export default FileUploader
