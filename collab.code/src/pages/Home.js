import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';

function Home() {

    const [newId, setnewID] = useState('');
    const [username, setUsername] = useState('');
    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidv4();
        setnewID(id);
        // console.log(id);
        toast.success('Created new room especially for you')
    }
    return <div
        className="HomePageWrapper">
        <div className="FormWrapper">
            <img src='/logo.svg' alt="loogoooooo"></img>
            <h4 className="label"> Paste Room Invitation ID</h4>
            <div className="Form">
                <input type="text"
                    className="roomId"
                    placeholder="ROOM ID"
                    onChange={(e) => setnewID(e.target.value)}
                    value={newId}>
                </input>
                <input type="text"
                    className="userName"
                    placeholder="USERNAME"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}></input>
                <button className="joinBtn"> Enter</button>
            </div>
            <span className="moreInfo">
                Create RoomId Here &nbsp;
                <a href="" className="createRoom" onClick={createNewRoom}> New Room </a>
            </span>
        </div>
        <footer>
            <h4>Built with ♡ by {''}
                <a href="https://github.com/Manasvi05Dadhich">
                    Manasvi
                </a>
            </h4>
        </footer>
    </div>
}

export default Home;