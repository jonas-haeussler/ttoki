import React from 'react';
import { Card, Carousel, Col, Container, Row } from "react-bootstrap";
import "./Home.css";
const Fade = require("react-reveal/Fade");


const MenuItem = (props: {imagePath:string, title:string, text?:string, link:string, delay:number}) => {

    return (
        <Col xs={6} md={3}>
            <Fade left delay={props.delay}>
            <Card.Link href={props.link} style={{textDecoration:"none", color:"#212529"}}>
                <Card style={{width: "100%"}} className="shadow-lg p-3 mb-4 bg-body rounded">
                    <Card.Img variant="top" src={props.imagePath} style={{width: "40%", height: "40%", margin: "auto"}}/>
                    <Card.Body style={{padding:"1rem 0"}}>
                        <Card.Title style={{textAlign:"center"}}>{props.title}</Card.Title>
                        <Card.Text>
                                {props.text}
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Card.Link>
            </Fade>
        </Col>
    );
}

const Home = () => {
    
      
    return (
        <>
            <Container fluid="md" style={{padding:0}}>
                <Carousel style={{fontFamily: "Nunito"}}>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src="./home_image.jpg"
                        alt="Home Page"
                        />
                        <Carousel.Caption>
                        <h3>Herzlich Willkommen bei TSG Oberkirchberg Tischtennis</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src="./throwback/aufstieg.jpg"
                        alt="Aufstieg"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 1: Aufstieg in die Bezirksklasse 2017</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src="./throwback/grillen.jpg"
                        alt="Grillen"
                        />

                        <Carousel.Caption>
                            <h3>#Throwback 2: Grillen bei Joker</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src="./throwback/volleyball.jpg"
                        alt="Volleyball"
                        />

                        <Carousel.Caption>
                            <h3>#Throwback 3: Volleyballturnier 5. Platz</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                </Carousel>
            </Container>
            <Container style={{marginTop:"5%"}}>
                <Row>
                        <MenuItem imagePath="./kalender.png" title="Planung" text="" link="/planning" delay={500} />
                        <MenuItem imagePath="./statistiken.png" title="Statistiken" link="/statistics" delay={700} />
                        <MenuItem imagePath="./upcoming.png" title="Kommende" link="/upcoming" delay={900}/>
                        <MenuItem imagePath="./galerie.png" title="Ping Pong" link="/pingpong" delay={1100}/>
                </Row>
            </Container>
      </>
    );
}
export default Home;