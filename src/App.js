import React, { useEffect, useState } from "react";
import "./App.css";
import { ConnectButton, Modal } from "web3uikit";
import logo from "./images/Moralis.png";
import Coin from "./components/Coin";
import { abouts } from "./about";
import { useMoralisWeb3Api, useMoralis } from "react-moralis";

const App = () => {
    const [btc, setBTC] = useState(0);
    const [eth, setETH] = useState(0);
    const [link, setLINK] = useState(0);
    const [modalPrice, setModalPrice] = useState();
    const Web3Api = useMoralisWeb3Api();
    const { Moralis, isInitialized } = useMoralis();
    const [visible, setVisible] = useState(false);
    const [modalToken, setModalToken] = useState();

    async function getRatio(ticker, setPerc) {
        const Votes = Moralis.Object.extend("DappVotes");
        const query = new Moralis.Query(Votes);
        query.equalTo("ticker", ticker);
        query.descending("createdAt");
        const results = await query.first();
        console.log("Results: ", results);

        let up = 0;
        let down = 0;
        let ratio = 0;

        if (results) {
            up = Number(results.attributes.up);
            down = Number(results.attributes.down);
            ratio = Math.round((up / (up + down)) * 100);
        }
        setPerc(ratio);
    }

    useEffect(() => {
        if (isInitialized) {
            getRatio("BTC", setBTC);
            getRatio("ETH", setETH);
            getRatio("LINK", setLINK);

            async function createLiveQuery() {
                let query = new Moralis.Query("DappVotes");
                let subscription = await query.subscribe();
                subscription.on("update", (object) => {
                    if (object.attributes.ticker === "LINK") {
                        getRatio("LINK", setLINK);
                    } else if (object.attributes.ticker === "ETH") {
                        getRatio("ETH", setETH);
                    } else if (object.attributes.ticker === "BTC") {
                        getRatio("BTC", setBTC);
                    }
                });
            }

            createLiveQuery();
        }
    }, [isInitialized]);

    useEffect(() => {
        async function fetchTokenPrice() {
            const options = {
                address:
                    abouts[abouts.findIndex((a) => a.token === modalToken)]
                        .address,
            };
            const price = await Web3Api.token.getTokenPrice(options);
            setModalPrice(price.usdPrice.toFixed(2));
        }
        if (modalToken) {
            fetchTokenPrice();
        }
    }, [modalToken]);

    return (
        <>
            <div className="header">
                <div className="logo">
                    <img src={logo} alt="logo" height={"50px"} />
                    Sentiment
                </div>
                <ConnectButton />
            </div>

            <div className="instructions">
                Where do you think these tokens are going? Up or Down?
            </div>

            <div className="list">
                <Coin
                    perc={btc}
                    setPerc={setBTC}
                    token="BTC"
                    setModalToken={setModalToken}
                    setVisible={setVisible}
                />
                <Coin
                    perc={eth}
                    setPerc={setETH}
                    token="ETH"
                    setModalToken={setModalToken}
                    setVisible={setVisible}
                />
                <Coin
                    perc={link}
                    setPerc={setLINK}
                    token="LINK"
                    setModalToken={setModalToken}
                    setVisible={setVisible}
                />
            </div>

            <Modal
                isVisible={visible}
                onCloseButtonPressed={() => setVisible(false)}
                hasFooter={false}
                title={modalToken}
            >
                <div>
                    <span style={{ color: "white" }}>{`Price`}</span>$
                    {modalPrice}
                </div>
                <div>
                    <span style={{ color: "white" }}>{`About`}</span>
                </div>
                <div>
                    {modalToken &&
                        abouts[abouts.findIndex((x) => x.token === modalToken)]
                            .about}
                </div>
            </Modal>
        </>
    );
};

export default App;
