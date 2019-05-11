import React from 'react';
import axios from '../../configs/axios'
import {Route, Switch} from "react-router-dom";
import {Button, ButtonGroup, ListGroup} from "react-bootstrap";
import ProjectPost from './ProjectPost';
import ProjectMenu from './ProjectMenu';
import {Project as ProjectStore} from "../Layout/store";


function events({match}){
    return (
        <div className={'mt-3'}>
            <ul>
                {this.state.events.map((event) => (
                    <li className={'pr-4 my-1'} key={event.id} dangerouslySetInnerHTML={{__html: event.description}} />
                ))}
            </ul>
        </div>
    );
}


class Project extends React.Component {
    constructor(props){
        super(props);
        
        this.state = {
            id: this.props.match.params.id,
            post_id: 0,
            project: {},
            posts: [],
            events: [],
            post: {},
        };
    }
    
    render() {
        return (
            <div>
                <div className={'float-left position-sticky overflow-auto border-right project-left'}>
                    <ListGroup>
                        <ListGroup.Item variant={'light'} className={'text-dark'}>
                            <ButtonGroup className={'h4 mb-0 text-truncate'} style={{width: '169px'}} title={this.state.project.name}>{this.state.project.name}</ButtonGroup>
                            <ButtonGroup>
                                <Button variant={'link'} href={'#/project_manager/'+this.state.id+'/basic'}>管理</Button>
                                <Button variant={'link'} href={'/post/0/edit'}>+</Button>
                            </ButtonGroup>
                        </ListGroup.Item>
                    </ListGroup>
                    <ProjectMenu project_id={this.state.id} posts={this.state.posts} toggle={(posts) => this.setState({posts})} />
                </div>
                <div className={'float-left project-right'}>
                    <Switch>
                    <Route path={this.props.match.path+'/post/:post_id'} component={ProjectPost} />
                    <Route path={this.props.match.path+'/edit'} render={() => (
                        <div>edit</div>
                    )} />
                    <Route path={this.props.match.path} extra render={() => (
                        <div className={'mt-3'}>
                            <ul>
                                {this.state.events.map((event) => (
                                    <li className={'pr-4 my-1'} key={event.id} dangerouslySetInnerHTML={{__html: event.description}} />
                                ))}
                            </ul>
                        </div>
                    )} />
                    </Switch>
                </div>
            </div>
        );
    }
    
    componentDidMount() {
        axios.get('/project/'+this.state.id).then((data) => {
            let state = Object.assign({}, this.state, data);
            this.setState(state);
            // 设置全局项目信息
            ProjectStore.dispatch({type: 'set', project: state.project});
        }).catch(()=>{});
    }
}

export default Project;
