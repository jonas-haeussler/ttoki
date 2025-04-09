import { Card, Carousel, Col, Container, Row } from "react-bootstrap";
import "./Home.css";
import { Fade } from "react-awesome-reveal";
import homeImage from './assets/home_image.jpg';
import aufstieg from './assets/throwback/aufstieg.jpg';
import grillen from './assets/throwback/grillen.jpg';
import volleyball from './assets/throwback/volleyball.jpg';
import kalender from './assets/kalender.png';
import statistiken from './assets/statistiken.png';
import upcoming from './assets/upcoming.png';
import galerie from './assets/galerie.png';
import wanderung from './assets/throwback/wanderung.jpg';
import bozen from './assets/throwback/bozen.jpg';
import meisterfeier from './assets/throwback/meisterfeier.jpg';
import radeln from './assets/throwback/radeln.jpg';


const MenuItem = (props: {imagePath:string, title:string, text?:string, link:string, delay:number}) => {

    return (
        <Col xs={6} md={3}>
            <Fade direction="left" delay={props.delay}>
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
                        src={homeImage}
                        alt="Home Page"
                        />
                        <Carousel.Caption>
                        <h3>Herzlich Willkommen bei TSG Oberkirchberg Tischtennis</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={meisterfeier}
                        alt="Meister 2024"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 1: Meister in der Kreisliga A 2024</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={bozen}
                        alt="Bozen 2023"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 2: Abendessen im Trainingslager in Bozen</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={radeln}
                        alt="Radeln zum Bergfest"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 3: Alljährliches Radeln zum Bergfest</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={wanderung}
                        alt="Wanderung auf den Säuling"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 4: Wanderung auf den Säuling</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={aufstieg}
                        alt="Aufstieg"
                        />
                        <Carousel.Caption>
                            <h3 >#Throwback 5: Aufstieg in die Bezirksklasse 2017</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={grillen}
                        alt="Grillen"
                        />

                        <Carousel.Caption>
                            <h3>#Throwback 6: Grillen bei Joker</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item interval={5000}>
                        <img
                        className="d-block w-100"
                        src={volleyball}
                        alt="Volleyball"
                        />

                        <Carousel.Caption>
                            <h3>#Throwback 7: Volleyballturnier 5. Platz</h3>
                        </Carousel.Caption>
                    </Carousel.Item>
                </Carousel>
            </Container>
            <Container style={{marginTop:"5%"}}>
                <Row>
                        <MenuItem imagePath={kalender} title="Planung" text="" link="/planning" delay={500} />
                        <MenuItem imagePath={statistiken} title="Statistiken" link="/statistics" delay={700} />
                        <MenuItem imagePath={upcoming} title="Kommende" link="/upcoming" delay={900}/>
                        <MenuItem imagePath={galerie} title="Ping Pong" link="/pingpong" delay={1100}/>
                </Row>
            </Container>
      </>
    );
}
export default Home;