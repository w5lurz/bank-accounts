import { useMemo, useState } from 'react';
import './App.css';
import UserStory1 from './components/UserStory1';
import UserStory2 from './components/UserStory2';
import UserStory3 from './components/UserStory3';
import UserStory4 from './components/UserStory4';
import UserStory5 from './components/UserStory5';

type StoryId = 1 | 2 | 3 | 4 | 5;

const STORY_OPTIONS: Array<{ id: StoryId; label: string }> = [
	{ id: 1, label: 'User Story 1' },
	{ id: 2, label: 'User Story 2' },
	{ id: 3, label: 'User Story 3' },
	{ id: 4, label: 'User Story 4' },
	{ id: 5, label: 'User Story 5' },
];

function App() {
	const [activeStory, setActiveStory] = useState<StoryId>(1);

	const activeView = useMemo(() => {
		switch (activeStory) {
			case 1:
				return <UserStory1 />;
			case 2:
				return <UserStory2 />;
			case 3:
				return <UserStory3 />;
			case 4:
				return <UserStory4 />;
			case 5:
				return <UserStory5 />;
		}
	}, [activeStory]);

	return (
		<main className="accounts-page">
			<div className="stories-shell">
				<nav className="stories-nav" aria-label="User Stories">
					<div className="stories-segmented" role="tablist" aria-label="Select user story">
						{STORY_OPTIONS.map((story) => (
							<button
								key={story.id}
								id={`story-tab-${story.id}`}
								role="tab"
								type="button"
								aria-selected={activeStory === story.id}
								className={`story-tab ${activeStory === story.id ? 'active' : ''}`}
								onClick={() => setActiveStory(story.id)}
							>
								{story.label}
							</button>
						))}
					</div>
				</nav>
				{activeView}
			</div>
		</main>
	);
}

export default App;
