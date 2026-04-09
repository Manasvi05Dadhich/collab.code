import React from "react";

function Home() {
    return <div
        className="HomePageWrapper">
        <div className="FormWrapper">

            <img src='/logo.svg' alt="loogoooooo"></img>
            <h4> Paste Room Invitation ID</h4>
            <div className="form">
                <input type="text" className="roomId" placeholder="ROOM ID"></input>
                <input type="text" className="userName" placeholder="USERNAME"></input>
                <button className="joinBtn"> Enter</button>
            </div>
            <span className="moreInfo">
                Create RoomId Here &nbsp;
                <a href="" className="createRoom"> New Room </a>
            </span>
        </div>
        <footer>
            <h4>Built with love by {''}
                <a href="https://github.com/Manasvi05Dadhich">
                    Manasvi
                </a>
            </h4>
        </footer>
    </div>
}

export default Home;