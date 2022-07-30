import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Square = (props: {text:string}) => {
    return (
        <div style={{margin: "2% 1% 2% 0%"}} className="square">{props.text}</div>
    );
}
const Heading = (props: {title:string, subtitle:string}) => {
    return (
        <div style={{margin:"2% 2% 2% 2%"}}>
            <h3>{props.title}</h3>
            <h4>{props.subtitle}</h4>
        </div>
    );
}

const PingPong = () => {
    return <><h1 style={{textAlign: "center", marginTop:"100px"}}>Noch in Arbeit 😄</h1></>
    /*
    return (
        <Container fluid="md" className="content">
            <h1 style={{marginTop:"2%"}}>Best Of Ping Pong</h1>
            <h2 style={{color:"grey"}}>Bilder und Videos</h2>
            <Row>
                <Col xs={12} md={6}>
                    <Container style={{marginTop: "2%"}} className="content">
                        <div style={{display:"flex"}}>
                            <Square text="TE"/>
                            <Heading title="test" subtitle="test2"/>
                        </div>
                        <hr
                            style={{
                                color: "black",
                                backgroundColor: "black",
                                height: 3,
                                marginTop: "0%"
                            }}
                        />
                        <img src="./galerie.png" alt="Bild" />;
                    </Container>
                </Col>
                <Col xs={12} md={6}>
                    <Container style={{marginTop: "2%"}} className="content">
                        <div style={{display:"flex"}}>
                            <Square text="TE"/>
                            <Heading title="test" subtitle="test2"/>
                        </div>
                        <img src="./galerie.png" alt="Bild" />;
                    </Container>
                </Col>
                <Col xs={12} md={6}>
                    <Container style={{marginTop: "2%"}} className="content">
                        <div style={{display:"flex"}}>
                            <Square text="TE"/>
                            <Heading title="test" subtitle="test2"/>
                        </div>
                        <img src="./galerie.png" alt="Bild" />;
                    </Container>
                </Col>
                <Col xs={12} md={6}>
                    <Container style={{marginTop: "2%"}} className="content">
                        <div style={{display:"flex"}}>
                            <Square text="TE"/>
                            <Heading title="test" subtitle="test2"/>
                        </div>
                        <img src="./galerie.png" alt="Bild" />;
                    </Container>
                </Col>
            </Row>
        </Container>
    );
    */
} 
export default PingPong;