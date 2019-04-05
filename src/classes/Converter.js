import FileSaver from 'file-saver'

class Converter {
  _state = {
    existing_schemas: [],
    schemas: {},
    style: "",
    dialect: "",
    module_info: {},
    datcat_hash: {}
  }

  _getModuleNamespaces = async (Url) => {
    let parser = new DOMParser()

    await fetch(Url)
    .then(response => response.text())
    .then(xml => parser.parseFromString(xml, "text/xml"))
    .then(tbxmd => {
      let module = tbxmd.getElementsByTagName("tbxmd")[0].getAttribute("module")
      this._state.module_info[module] = {
        ns: tbxmd.getElementsByTagName("tbxmd")[0].getAttribute("ns"),
        dcs: []
      }
      return Array.from(tbxmd.getElementsByTagName("datCatSet")[0]
                  .childNodes)
                  .filter(node => node.nodeType === 1)
                  .map(node => [module, node])
    })
    .then(childNodes =>
      childNodes.forEach(nodeInfo => {
        let module = nodeInfo[0]
        let node = nodeInfo[1]
        let name = node.getAttribute("name")

        this._state.module_info[module].dcs.push(name)
        this._state.datcat_hash[name] = {
          "module": module,
          metaType: node.nodeName.replace("Spec", "")
        }
      })
    )
  }

  _setValidationMaterial = () => {
    const Url = `https://validate.tbxinfo.net/dialects/${this._state.dialect}`

    return fetch(Url)
    .then(data => data.json())
    .then(result => {
      this._state.schemas = {
        dca: [
          `href="${result[0].dca_rng}" ` +
            `type="application/xml" ` +
            `schematypens="http://relaxng.org/ns/structure/1.0"`,
          `href="${result[0].dca_sch}" `+
            `type="application/xml" ` +
            `schematypens="http://purl.oclc.org/dsdl/schematron"`
        ],
        dct: [
          `href="${result[0].dct_nvdl}" ` +
            `type="application/xml"` +
            `schematypens="http://purl.oclc.org/dsdl/nvdl/ns/structure/1.0"`,
          `href="${result[0].dct_sch}" ` +
            `type="application/xml" ` +
            `schematypens="http://purl.oclc.org/dsdl/schematron"`
        ]
      }
      return result[0].modules
    })
    .then(async modules => {
      for (let i = 0; i < modules.length; i++) {
        if (!modules[i].name.match(/core/i)) {
          await this._getModuleNamespaces(modules[i].tbxmd)
        }
      }
    })
  }

  _replaceWithNewStyle = (node, callback) => {
    let newNode = callback(node) || node
    node.childNodes.forEach(childNode => {
      if (childNode.nodeType === 1)
        this._replaceWithNewStyle(childNode, callback)
      if (newNode !== node)
        newNode.appendChild(childNode)
    })

    if (node.attributes)
      for (let i = 0; i < node.attributes.length; i++) {
        let item = node.attributes.item(i)
        if (item.name !== "type")
          newNode.setAttribute(item.name, item.value)
      }
    node.parentNode.replaceChild(newNode, node)
  }

  // _convertNode = (node, style) => (style === "dca") ?
  //                 this._toDCT(node) : this._toDCA(node)
  _toDCA = (node) => {
    let sansPrefix = node.nodeName.replace(/\w+:/, "")
    if (Object.keys(this._state.datcat_hash).includes(sansPrefix)) {
      let tagName = this._state.datcat_hash[sansPrefix].metaType
      let elt = document.createElementNS(
        node.ownerDocument.documentElement.getAttribute("xmlns"),
        tagName
      )
      elt.setAttribute("type", sansPrefix)
      return elt
    }
  }
  _toDCT = (node) => {
    if (node.attributes && node.getAttribute("type")) {
      let tagName = node.getAttribute("type")
      let module = this._state.datcat_hash[tagName].module
      return document.createElementNS(this._state.module_info[module].ns, `${module}:${tagName}`)
    }
  }

  _checkStyle = (tbxRoot) => tbxRoot.match(/"dca"/i) ? "dca" : "dct"

  convert = (file) => {
    let reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        let content = reader.result

        let parser = new DOMParser()
        let tbxDoc = parser.parseFromString(content, "text/xml")

        tbxDoc.childNodes.forEach(node => {
          if (node.nodeType === 7) {
            this._state.existing_schemas.push(node)
          } else if (node.nodeName === "tbx") {
            this._state.dialect = node.getAttribute("type")
          }
        })

        this._state.existing_schemas.forEach(schema =>
          tbxDoc.removeChild(schema)
        )

        let body = tbxDoc.getElementsByTagName("body")[0]

        this._setValidationMaterial()
        .then(() => {
          this._state.style = tbxDoc.getElementsByTagName("tbx")[0].getAttribute("style")
          this._state.newStyle = (this._state.style === "dct") ? "dca" : "dct"
          tbxDoc.getElementsByTagName("tbx")[0].setAttribute(
            "style",
            this._state.newStyle
          )
        })
        .then(() => {
          let schemaStyle = (this._state.dialect.match(/^TBX-Core$/i)) ? "dca" : this._state.newStyle
          let schemas = this._state.schemas[schemaStyle]
          schemas.forEach(instruction => {
            let procInstruction = tbxDoc.createProcessingInstruction('xml-model', instruction)
            tbxDoc.insertBefore(procInstruction, tbxDoc.firstChild)
          })

          let tbx = tbxDoc.documentElement
          if (this._state.newStyle === "dct") {
            Object.keys(this._state.module_info).forEach(module => {
              let moduleInfo = this._state.module_info[module]
              tbx.setAttributeNS(
                "http://www.w3.org/2000/xmlns/",
                `xmlns:${module}`,
                moduleInfo.ns
              )
            })
          } else {
            Object.keys(this._state.module_info).forEach(module => {
              tbx.removeAttributeNS(
                "http://www.w3.org/2000/xmlns/",
                `${module}`
              )
            })
          }
        })
        .then(() =>
          (this._state.style === "dct") ? this._toDCA : this._toDCT
        )
        .then((callback) => this._replaceWithNewStyle(body, callback))
        .then(() => FileSaver.saveAs(
          new Blob(
            [(new XMLSerializer()).serializeToString(tbxDoc)],
            {type: "text/xml;charset=utf-8"}
          ),
          file.name.replace(".tbx", `_${this._state.newStyle}.tbx`
        )))
        .then(resolve)
        .catch(reject)
      }
      //
      // reader.onerror = (e) => reject(e)

      reader.readAsText(file)
    })
  }
}

export default Converter
