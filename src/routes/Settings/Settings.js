const React = require('react');
const { NavBar } = require('stremio/common');
const styles = require('./styles');
const SectionsSelector = require('./SectionsSelector');
const SectionsList = require('./SectionsList');
const { settingsSections } = require('./constants');
const useSettings = require('./useSettings');

const devTestWithUser = false;

const Settings = () => {
    const [preferences, setPreferences] = useSettings(devTestWithUser);
    const [dynamicSections, setDynamicSections] = React.useState(settingsSections);
    // TODO: The Streaming section should be handled separately
    const sections = React.useMemo(()=>Object.keys(dynamicSections)
        .map((section) => ({
            id: section,
            inputs: dynamicSections[section],
            ref: React.createRef()
        })), [dynamicSections]);

    const [selectedSectionId, setSelectedSectionId] = React.useState(sections[0].id);
    const scrollContainerRef = React.useRef(null);

    React.useEffect(() => {
        const shouldFetch = preferences.server_url && preferences.server_url.length > 0
            ?
            Promise.resolve(preferences.server_url + 'settings')
            :
            Promise.reject();

        shouldFetch
            .then(fetch)
            .then(response => response.json())
            .then(serverPrefs => serverPrefs.options
                .map(opt => ({
                    id: opt.id,
                    label: opt.label,
                    header: opt.label,
                    type: opt.type,
                    options: opt.selections.map(sel => ({ label: sel.name, value: JSON.stringify(sel.val) }))
                }))
                .concat({
                    id: 'torrent_profile',
                    label: 'Torrent Profile',
                    header: 'Torrent Profile',
                    type: 'select',
                    options: [
                        { label: 'Default', value: 'profile-default' },
                        { label: 'Soft', value: 'profile-soft' },
                        { label: 'Fast', value: 'profile-fast' }
                    ],
                })
            )
            .catch(() => []).then(serverInputs => {
                const additionalServerSettings = [
                    { id: 'server_url', header: 'Streaming server URL:', type: 'info' },
                    { id: 'streaming_server_is_available.', label: 'Streaming server is ' + (serverInputs.length !== 0 ? '' : 'not ') + 'available.', type: 'static-text', icon: serverInputs.length !== 0 ? 'ic_check' : 'ic_x' }
                ];
                setDynamicSections({
                    ...dynamicSections,
                    Streaming: [
                        ...dynamicSections.Streaming,
                        ...serverInputs,
                        ...additionalServerSettings
                    ]
                });
            });
    }, [preferences.server_url]);

    /////////////////

    const updatePreference = (option, value) => {
        setPreferences({ ...preferences, [option]: value });
    }

    const changeSection = React.useCallback((event) => {
        const currentSectionId = event.currentTarget.dataset.section;
        const section = sections.find((section) => section.id === currentSectionId);
        //setSelectedSectionId(currentSectionId);
        scrollContainerRef.current.scrollTo({
            top: section.ref.current.offsetTop,
            behavior: 'smooth'
        });
    }, [sections]);

    const sectionListOnScorll = React.useCallback((event) => {
        const scrollContainer = event.currentTarget;
        if (scrollContainer.scrollTop + scrollContainer.clientHeight === scrollContainer.scrollHeight) {
            setSelectedSectionId(sections[sections.length - 1].id);
        } else {
            for (let i = sections.length - 1;i >= 0;i--) {
                if (sections[i].ref.current.offsetTop <= scrollContainer.scrollTop) {
                    setSelectedSectionId(sections[i].id);
                    break;
                }
            }
        }
    }, [sections]);

    return (
        <div className={styles['settings-parent-container']}>
            <NavBar
                className={styles['nav-bar']}
                backButton={true}
                addonsButton={true}
                fullscreenButton={true}
                navMenu={true} />
            <div className={styles['settings-container']}>
                <SectionsSelector className={styles['side-menu']} sections={sections} selectedSectionId={selectedSectionId} onSelectedSection={changeSection} />
                <SectionsList ref={scrollContainerRef} className={styles['scroll-container']} sections={sections} preferences={preferences} onPreferenceChanged={updatePreference} onScroll={sectionListOnScorll} />
            </div>
        </div>
    );
};

module.exports = Settings;
