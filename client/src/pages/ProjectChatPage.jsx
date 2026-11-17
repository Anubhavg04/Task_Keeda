import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectAPI } from '../services/api.js';
import DiscussionThread from '../components/DiscussionThread.jsx';
import { ErrorState, LoadingState, PageHeading, buttonSecondary } from '../components/WorkspaceUI.jsx';

const ProjectChatPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    projectAPI.getProjects()
      .then((response) => {
        if (!active) return;
        const selectedProject = response.data.find((item) => item._id === projectId);
        if (selectedProject) setProject(selectedProject);
        else setError('This team workspace was not found or you no longer have access.');
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load this team workspace.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  return (
    <div className="py-7 sm:py-9">
      <PageHeading
        eyebrow="Team workspace"
        title={project ? `${project.name} chat` : 'Team chat'}
        description="Share updates and questions with everyone in this workspace."
        action={<Link to="/projects" className={buttonSecondary}>Back to workspaces</Link>}
      />
      {loading ? <LoadingState label="Loading team workspace..." /> : error ? (
        <ErrorState message={error} />
      ) : (
        <DiscussionThread
          projectId={projectId}
          title="Workspace discussion"
          projectOwnerId={project.owner?._id}
          members={[project.owner, ...(project.members || [])].filter(Boolean)}
        />
      )}
    </div>
  );
};

export default ProjectChatPage;
