import React from "react";
import Avatar from 'react-avatar'

export default function Client({ username }) {
    return (<div className="CLient">
        <Avatar name={username} size={50} round={14} />
        <span className="username"> {username}</span>
    </div>
    
    
)

}

