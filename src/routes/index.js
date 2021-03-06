import React, {Component} from 'react'
import {HashRouter, Route, Switch} from 'react-router-dom'

import Home from "../pages/Home"

class Router extends Component {
  render(){
    return(
      <HashRouter>
        <Switch>
          <Route exact path='/' component={Home}/>
        </Switch>
      </HashRouter>
    )
  }
}

export default Router
