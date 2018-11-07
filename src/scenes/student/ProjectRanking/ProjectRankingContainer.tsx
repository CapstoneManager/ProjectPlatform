import * as React from 'react';
import update from 'immutability-helper';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import ProjectCard from './ProjectCard';
import ItemTypes from './ItemTypes';
import { getApiURI, getUserEmail } from '../../../common/server';
import { Button, Intent, NonIdealState, Spinner, Card, Tooltip } from '@blueprintjs/core';
import { Loading } from 'components/Loading';
import { fetchServer } from 'common/server';
import { MainToast } from 'components/MainToast';
import autobind from 'autobind-decorator';

const cardTarget = {
    drop() {
        return undefined;
    },
};

interface IProjectRankingContainerProps {
    connectDropTarget?: any;
}

interface IProjectRankingContainerState {
    isLoading: boolean;
    rankedProjects: Array<IProject>;
    submitted: boolean;
    email: string;
}

interface IProject {
    projectId: number;
    projectName: string;
    statusId: number;
    minSize: number;
    maxSize: number;
    technologies: string;
    background: string;
    description: string;
}

@DragDropContext(HTML5Backend)
@DropTarget(ItemTypes.CARD, cardTarget, connect => ({
    connectDropTarget: connect.dropTarget(),
}))

@autobind
class ProjectRankingContainer extends React.Component<IProjectRankingContainerProps, IProjectRankingContainerState> {

    public state: IProjectRankingContainerState = {
        isLoading: false,
        rankedProjects: [],
        submitted: false,
        email: ''
    };

    async componentDidMount() {
        this.setState({ isLoading: true });

        const response = await fetchServer(`/projects/student/${getUserEmail()}/rankings`);
        const data = await response.json();

        this.setState({
            rankedProjects: data,
            isLoading: false
        });
    }

    async submitClicked() {
        var submit = confirm('Are you sure you want to submit rankings?');
        if (submit) {
            const email = sessionStorage.getItem('email');
            const rankings: number[] = this.state.rankedProjects.map((project: IProject) => project.projectId);
            const response = await fetchServer(`/projects/${email}/submit-ranking`, 'POST', rankings);
            if (response.ok) {
                MainToast.show({
                    message: 'Project rankings have been submitted!',
                    icon: 'tick',
                    intent: Intent.SUCCESS,
                });
            }
            this.setState({ submitted: true });
        }
    }

    moveCard(id: number, atIndex: number) {
        const { projectCard, index } = this.findCard(id);
        this.setState(
            update(this.state, {
                rankedProjects: {
                    $splice: [[index, 1], [atIndex, 0, projectCard]],
                },
            }),
        );
    }

    findCard(id: number) {
        const { rankedProjects } = this.state;
        const projectCard = rankedProjects.filter(c => c.projectId === id)[0];

        return {
            projectCard,
            index: rankedProjects.indexOf(projectCard),
        };
    }

    render() {
        const { connectDropTarget } = this.props;
        const { rankedProjects, isLoading, submitted } = this.state;

        if (submitted) {
            return (
                <div className="csci-form-container">
                    <div className="csci-form-actions">
                        <h3 style={{ margin: 0 }}>You've already submitted your rankings.</h3>
                    </div>
                </div>
            );
        }

        if (isLoading) {
            return <Loading />;
        }

        return connectDropTarget(
            <div className="csci-container">
                <div className="csci-side">
                    <Card>
                        <p>
                            Drag to reorder projects by priority.
                            Your first 5 preferences will be considered.
                            Click "Submit Rankings" when finished.
                        Rankings can only be submitted once.</p>
                    </Card>
                </div>
                <div className="csci-main">
                    <div className="csci-form-container">
                        <div className="csci-form-actions">
                            <h1 style={{ margin: 0 }}>Rank Projects</h1>
                        </div>
                        <Card className="csci-form">
                            {rankedProjects.map((projectCard: IProject, index: number) => (
                                <Tooltip
                                    wrapperTagName="div"
                                    targetTagName="div"
                                    position="right"
                                    content={
                                        <div style={{ padding: 20 }}>
                                            <strong>Project Description</strong>
                                            <p>{projectCard.description}</p>
                                            <br />
                                            <strong>Technologies Expected</strong>
                                            <p>{projectCard.technologies}</p>
                                            <br />
                                            <strong>Background Requested</strong>
                                            <p>{projectCard.background}</p>
                                        </div>}
                                >
                                    <ProjectCard
                                        key={projectCard.projectId}
                                        rank={index + 1}
                                        id={projectCard.projectId}
                                        name={projectCard.projectName}
                                        minSize={projectCard.minSize}
                                        maxSize={projectCard.maxSize}
                                        technologies={projectCard.technologies}
                                        background={projectCard.background}
                                        description={projectCard.description}
                                        moveCard={this.moveCard}
                                        findCard={this.findCard}
                                    />
                                </Tooltip>
                            ))}
                        </Card>
                        <div className="csci-form-actions">
                            <Button text="Submit Rankings" intent={Intent.PRIMARY} large={true} onClick={this.submitClicked} />
                        </div>
                    </div>
                </div>
            </div >
        );
    }
}

export default ProjectRankingContainer;