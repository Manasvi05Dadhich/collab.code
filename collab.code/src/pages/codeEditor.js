import React, { useState } from "react";
import Client from "../components/Client";

function CodeEditor() {

      const [clients, setClients] = useState([
            { socketId: 1, username: 'md' },
            { socketId: 2, username: 'mdada' }
      ])

      return <div className="MainWrap">
            <div className="LeftBar">
                  <div className="asideInner">
                        <div className="Logo">
                              <img src='/logo.svg' alt="loogoooooo"></img>
                        </div>
                        <h4>
                              Connected
                        </h4>
                        <div className="ClientList">
                              {clients.map((client) => (
                                    <Client key={client.socketId} username={client.username} />
                              ))}
                        </div>
                  </div>
            </div>
            <div className="CodingArea">

            </div>

      </div>
}

export default CodeEditor;