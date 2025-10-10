


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type PlaylistItem, type Setlist, type MetronomeSettings } from '../types';
import { useMetronome } from '../contexts/MetronomeContext';
import { 
    DragHandleIcon,
    SetlistPlayIcon,
    StopIcon,
    TrashIcon,
    PlusIcon,
    EditIcon,
    DuplicateIcon,
    ChevronLeftIcon,
    SequenceAdvancedIcon,
    SequenceGridIcon,
    SequenceRingIcon
} from './Icons';

interface SetlistManagerProps {
  isContainerOpen: boolean;
  onToggleVisibility: () => void;
  onActiveSetlistChange: (id: string | null) => void;
}

const COLORS = ['#1e3a8a', '#312e81', '#4c1d95', '#581c87', '#831843', '#881337', '#7f1d1d'];
const getSetlistColor = (index: number) => COLORS[index % COLORS.length];

const SetlistManager: React.FC<SetlistManagerProps> = (props) => {
  const { onToggleVisibility, isContainerOpen, onActiveSetlistChange } = props;
  const {
    setlists,
    currentlyPlayingId,
    playingSetlistId,
    loadedSongInfo,
    newlyAddedItemId,
    isDirty,
    setlistActions,
    handleLoadSong,
    handleLoadAndPlay,
    handleStop,
    isPlaying,
    onRenameTriggered,
  } = useMetronome();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newlyAddedItemRef = useRef<HTMLDivElement>(null);
  const transparentImage = useRef(new Image());

  useEffect(() => {
    // Used to hide the default drag ghost image
    transparentImage.current.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }, []);

  const dragSetlist = useRef<number | null>(null);
  const dragOverSetlist = useRef<number | null>(null);
  const dragSong = useRef<{setlistId: string, songIndex: number} | null>(null);
  const dragOverSong = useRef<{setlistId: string, songIndex: number} | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ type: 'setlist' | 'song'; setlistId?: string; index: number } | null>(null);

  useEffect(() => {
    if (activeSetlistId && !setlists.some(sl => sl.id === activeSetlistId)) {
      setActiveSetlistId(null);
    }
  }, [setlists, activeSetlistId]);

  useEffect(() => {
    onActiveSetlistChange(activeSetlistId);
  }, [activeSetlistId, onActiveSetlistChange]);

  useEffect(() => {
    if (newItemId && newlyAddedItemRef.current) {
        setTimeout(() => {
            newlyAddedItemRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 350);
    }
  }, [newItemId]);

  useEffect(() => {
    if (editingItemId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingItemId]);

  useEffect(() => {
    if (newlyAddedItemId) {
      const { type, id } = newlyAddedItemId;
      setNewItemId(id);
      setEditingItemId(id);
      if (!isContainerOpen) onToggleVisibility();

      if (type === 'setlist') {
        setActiveSetlistId(null);
        const newSetlist = setlists.find(s => s.id === id);
        if (newSetlist) {
            setEditingText(newSetlist.name);
        }
      } else { // song
        for (const setlist of setlists) {
          const newSong = setlist.songs.find(s => s.id === id);
          if (newSong) {
            setActiveSetlistId(setlist.id);
            setEditingText(newSong.name);
            break;
          }
        }
      }
      onRenameTriggered();
    }
  }, [newlyAddedItemId, setlists, isContainerOpen, onToggleVisibility, onRenameTriggered]);

  const handleStartRename = (e: React.MouseEvent | React.TouchEvent, id: string, currentName: string) => {
    e.stopPropagation();
    if (editingItemId) return;
    setEditingItemId(id);
    setEditingText(currentName);
  };
  
  const handleSaveName = () => {
    if (!editingItemId) return;
    const trimmedText = editingText.trim();
    
    if (!trimmedText) {
      setEditingItemId(null);
      setNewItemId(null);
      return;
    }

    const setlist = setlists.find(sl => sl.id === editingItemId);
    if (setlist) {
      setlistActions.updateSetlistName(editingItemId, trimmedText);
    } else {
      for (const sl of setlists) {
        if (sl.songs.some(s => s.id === editingItemId)) {
          setlistActions.updateSongName(sl.id, editingItemId, trimmedText);
          break;
        }
      }
    }
    setEditingItemId(null);
    setNewItemId(null);
  };
  
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName();
    else if (e.key === 'Escape') setEditingItemId(null);
  };

  const handleToggleEditMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willEnterEditMode = !isEditMode;
    setIsEditMode(willEnterEditMode);
    if (willEnterEditMode && !isContainerOpen) {
      onToggleVisibility();
    }
    setEditingItemId(null);
  };

  const handleAddNewSetlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(false); 
    setlistActions.addNewSetlist();
  };

  const handleSetlistDragEnd = () => {
      if (dragSetlist.current !== null && dragOverSetlist.current !== null) {
        const reordered = [...setlists];
        const [item] = reordered.splice(dragSetlist.current, 1);
        
        let dropIndex = dragOverSetlist.current;
        if (dragSetlist.current < dropIndex) {
            dropIndex--;
        }

        reordered.splice(dropIndex, 0, item);
        setlistActions.reorderSetlists(reordered);
      }
      dragSetlist.current = null;
      dragOverSetlist.current = null;
      setDropIndicator(null);
  };
  
  const handleSongDragEnd = () => {
    if(dragSong.current && dragOverSong.current && dragSong.current.setlistId === dragOverSong.current.setlistId) {
        const setlistId = dragSong.current.setlistId;
        const setlist = setlists.find(sl => sl.id === setlistId);
        if (!setlist) return;

        const reorderedSongs = [...setlist.songs];
        const [draggedItem] = reorderedSongs.splice(dragSong.current.songIndex, 1);
        
        let dropIndex = dragOverSong.current.songIndex;

        if (dragSong.current.songIndex < dropIndex) {
            dropIndex--;
        }
        
        reorderedSongs.splice(dropIndex, 0, draggedItem);
        setlistActions.reorderSongs(setlistId, reorderedSongs);
    }
    dragSong.current = null;
    dragOverSong.current = null;
    setDropIndicator(null);
  }
  
  const handleSetlistClick = (setlist: Setlist) => {
    if (isEditMode || editingItemId === setlist.id) return;
    if (isPlaying) {
        handleStop();
    }
    setActiveSetlistId(setlist.id);
  };

  const handleSongClick = (song: PlaylistItem) => {
    if (isEditMode || editingItemId === song.id) return;

    // If a song is playing, clicking another song does nothing.
    if (currentlyPlayingId) {
      return;
    }

    // If nothing is playing, load the song.
    handleLoadSong(song, activeSetlistId as string);
  };


  const activeSetlist = activeSetlistId ? setlists.find(sl => sl.id === activeSetlistId) : null;

  return (
    <>
      <div className="w-full bg-[var(--container-bg)] backdrop-blur-md border border-[var(--container-border)] rounded-3xl transition-all duration-300 overflow-hidden">
        {activeSetlist ? (
          <div className="flex items-stretch h-[60px]">
            <div className="w-1.5 h-full" style={{backgroundColor: getSetlistColor(setlists.findIndex(s => s.id === activeSetlistId))}}></div>
            <div
              className="flex items-center flex-grow min-w-0 pl-[9px] group cursor-pointer mr-2"
              onClick={() => {
                if (document.activeElement?.tagName === 'INPUT' || editingItemId) return;
                if (playingSetlistId === activeSetlistId) {
                    handleStop();
                }
                setActiveSetlistId(null);
              }}
              aria-label="Back to setlists"
            >
              <div className="flex items-center flex-grow min-w-0">
                  <span className="flex items-center justify-center shrink-0">
                      <button className="p-1 -m-1 text-gray-300 group-hover:text-white transition-colors pointer-events-none" tabIndex={-1} aria-hidden="true">
                          <ChevronLeftIcon />
                      </button>
                  </span>
                  <div className="flex-grow min-w-0 ml-3">
                      {editingItemId === activeSetlist.id ? (
                          <input ref={inputRef} type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={handleEditKeyDown} onBlur={handleSaveName} className="bg-transparent text-white w-full outline-none font-semibold text-base" onClick={e => e.stopPropagation()} />
                      ) : (
                          <h3 onDoubleClick={(e) => handleStartRename(e, activeSetlist.id, activeSetlist.name)} className="text-left text-[var(--text-primary)] uppercase text-sm tracking-widest font-bold select-none truncate">{activeSetlist.name}</h3>
                      )}
                  </div>
              </div>
            </div>
            <div className="flex items-stretch flex-shrink-0 pr-[15px]">
                <div className="flex items-center">
                  <span className="font-semibold text-base text-white/70 tabular-nums">{activeSetlist.songs.length}</span>
                </div>
                <div className="w-px h-6 bg-[var(--container-border)] opacity-50 my-auto mx-4"></div>
                <button onClick={handleToggleEditMode} disabled={!activeSetlist || activeSetlist.songs.length === 0} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Edit songs">
                    <div className={`p-2 rounded-full pointer-events-none transition-colors ${isEditMode ? 'bg-blue-500 text-white' : 'text-gray-300 bg-white/10'}`}><EditIcon /></div>
                </button>
                <button onClick={() => setlistActions.addNewSong(activeSetlistId as string)} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Add song to setlist">
                  <div className="p-2 rounded-full pointer-events-none text-gray-300 bg-white/10"><PlusIcon/></div>
                </button>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch justify-between h-[60px] px-[15px]">
            <div role="button" onClick={onToggleVisibility} className="flex-grow flex items-center group cursor-pointer -ml-[15px] pl-[15px] mr-2">
              <h3 className="pl-2 text-left text-[var(--text-secondary)] uppercase text-sm tracking-widest font-bold select-none group-hover:text-[var(--text-primary)] transition-colors">Setlists</h3>
            </div>
            <div className="flex items-stretch flex-shrink-0">
              <div className="flex items-center">
                <span className="font-semibold text-base text-white/70 tabular-nums">{setlists.length}</span>
              </div>
              <div className="w-px h-6 bg-[var(--container-border)] opacity-50 my-auto mx-4"></div>
              {setlists.length > 0 && (
                  <button onClick={handleToggleEditMode} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Edit setlists">
                    <div className={`p-2 rounded-full pointer-events-none transition-colors ${isEditMode ? 'bg-blue-500 text-white' : 'text-gray-300 bg-white/10'}`}><EditIcon /></div>
                  </button>
              )}
              <button onClick={handleAddNewSetlistClick} className="flex items-center justify-center px-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Add new setlist">
                <div className="p-2 rounded-full pointer-events-none text-gray-300 bg-white/10"><PlusIcon /></div>
              </button>
            </div>
          </div>
        )}

        <div id="setlist-content" className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isContainerOpen ? 'max-h-[45vh]' : 'max-h-0'}`}>
          <div className="flex w-[200%] transition-transform duration-300 ease-in-out" style={{ transform: activeSetlist ? 'translateX(-50%)' : 'translateX(0)' }}>
            <div className="w-[50%] shrink-0">
              <div 
                className="space-y-[2px] max-h-[45vh] overflow-y-auto pb-2 bg-black/10"
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDropIndicator(null);
                    }
                }}
              >
                {setlists.length === 0 ? (
                    <div className="flex items-center justify-center h-24"><p className="text-gray-500 text-center px-4">Click the icon above to create a setlist.</p></div>
                ) : (
                    <>
                    {setlists.map((setlist, setlistIndex) => {
                        const isCreatingThisSetlist = newItemId === setlist.id;
                        const isEditingThisSetlist = editingItemId === setlist.id;
                        const setlistColor = getSetlistColor(setlistIndex);
                        const setlistBgColor = isCreatingThisSetlist ? 'rgba(255,255,255,0.15)' : setlistColor;
                        const ringClass = isCreatingThisSetlist ? 'ring-2 ring-blue-500' : '';
                        const isPlayingThisSetlist = playingSetlistId === setlist.id;

                        return (
                            <React.Fragment key={setlist.id}>
                                {dropIndicator?.type === 'setlist' && dropIndicator.index === setlistIndex && (
                                    <div className="h-0.5 bg-white mx-[15px]"/>
                                )}
                                <div 
                                    ref={newItemId === setlist.id ? newlyAddedItemRef : null} 
                                    draggable={isEditMode && !isCreatingThisSetlist} 
                                    onDragStart={(e) => {
                                        dragSetlist.current = setlistIndex;
                                        e.dataTransfer.setDragImage(transparentImage.current, 0, 0);
                                    }}
                                    onDragOver={(e) => {
                                        if (!isEditMode || dragSetlist.current === null || dragSetlist.current === setlistIndex) return;
                                        e.preventDefault();
                                        
                                        const targetElement = (e.currentTarget as HTMLElement);
                                        const rect = targetElement.getBoundingClientRect();
                                        const midY = rect.top + rect.height / 2;
                                        
                                        let dropIndex = setlistIndex;
                                        if (e.clientY > midY) {
                                            dropIndex = setlistIndex + 1;
                                        }
                                        
                                        if (dropIndicator?.index !== dropIndex || dropIndicator.type !== 'setlist') {
                                            dragOverSetlist.current = dropIndex;
                                            setDropIndicator({ type: 'setlist', index: dropIndex });
                                        }
                                    }}
                                    onDragEnd={handleSetlistDragEnd} 
                                    className={`transition-all duration-200 ${ringClass}`}
                                >
                                    <div className={`relative desktop-hover-effect flex items-center px-[15px] text-white/90 transition-all duration-200 ${isEditMode && !isCreatingThisSetlist ? 'cursor-grab' : 'cursor-pointer'} h-[60px]`} style={{backgroundColor: setlistBgColor}} onClick={() => handleSetlistClick(setlist)}>
                                    {isEditMode && !isCreatingThisSetlist && <span className="text-gray-500 p-1 mr-2"><DragHandleIcon /></span>}
                                    
                                    <span className="text-base font-mono text-white/50 text-right shrink-0">{setlistIndex + 1}</span>

                                    <div className="flex-grow min-w-0 ml-3">
                                        {isEditingThisSetlist ? (
                                            <input ref={inputRef} type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={handleEditKeyDown} onBlur={handleSaveName} className="bg-transparent text-white w-full outline-none font-semibold" onClick={e => e.stopPropagation()} />
                                        ) : (
                                            <span className="font-semibold truncate" onDoubleClick={(e) => handleStartRename(e, setlist.id, setlist.name)}>{setlist.name}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex-shrink-0 flex items-center gap-1 ml-2">
                                        {isCreatingThisSetlist || isEditingThisSetlist ? (
                                        <button onClick={(e) => { e.stopPropagation(); handleSaveName()}} className="px-4 h-9 flex items-center rounded-3xl bg-[var(--primary-accent)] text-black text-sm font-bold hover:bg-[var(--primary-accent-dark)] transition-colors" aria-label="Save changes">Save</button>
                                        ) : isEditMode ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => handleStartRename(e, setlist.id, setlist.name)} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-white/20 hover:text-white" aria-label="Rename setlist"><EditIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.duplicateSetlist(setlist.id); }} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-white/20 hover:text-white" aria-label="Duplicate setlist"><DuplicateIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.deleteSetlist(setlist.id); }} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-red-600/80 hover:text-white" aria-label="Delete setlist"><TrashIcon /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 pr-1">
                                                <span className="font-semibold text-white/70 tabular-nums">{setlist.songs.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        )
                    })}
                     {dropIndicator?.type === 'setlist' && dropIndicator.index === setlists.length && (
                        <div className="h-0.5 bg-white mx-[15px]"/>
                    )}
                    </>
                )}
              </div>
            </div>
            <div className="w-[50%] shrink-0">
              {activeSetlist && (
                <div 
                    className="space-y-[2px] max-h-[45vh] overflow-y-auto pb-2 bg-black/10"
                    onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDropIndicator(null);
                        }
                    }}
                >
                    {activeSetlist.songs.length === 0 ? <div className="flex items-center justify-center min-h-[96px]"><p className="text-center text-white/70 py-4 text-sm font-light px-4">This setlist is empty.</p></div> :
                    <>
                    {activeSetlist.songs.map((song, songIndex) => {
                        const isPlaying = currentlyPlayingId === song.id;
                        const isLoaded = loadedSongInfo?.songId === song.id && !isPlaying;
                        const isRenaming = editingItemId === song.id;
                        const hasUnsavedChanges = isDirty && loadedSongInfo?.songId === song.id;
                        const bpm = (song.settings as MetronomeSettings).bpm ?? 'N/A';
                        const setlistColor = getSetlistColor(setlists.findIndex(s => s.id === activeSetlistId));
                        const ringClass = isLoaded || isRenaming ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black/20' : '';
                        const containerClasses = ["relative desktop-hover-effect flex items-center group transition-all duration-200", ringClass, isEditMode || isRenaming ? '' : 'cursor-pointer', 'h-[60px]', isLoaded ? 'bg-white/15' : 'bg-black/20'].filter(Boolean).join(' ');

                        return (
                            <React.Fragment key={song.id}>
                                {dropIndicator?.type === 'song' && dropIndicator.setlistId === activeSetlistId && dropIndicator.index === songIndex && (
                                    <div className="h-0.5 bg-white mx-[15px]"/>
                                )}
                                <div ref={newItemId === song.id ? newlyAddedItemRef : null} 
                                    className={containerClasses} 
                                    onClick={() => handleSongClick(song)} 
                                    draggable={isEditMode} 
                                    onDragStart={(e) => {
                                        dragSong.current = { setlistId: activeSetlistId as string, songIndex };
                                        e.dataTransfer.setDragImage(transparentImage.current, 0, 0);
                                    }}
                                    onDragOver={(e) => {
                                        if (!isEditMode || !dragSong.current || dragSong.current.songIndex === songIndex) return;
                                        e.preventDefault();
                                        
                                        const targetElement = (e.currentTarget as HTMLElement);
                                        const rect = targetElement.getBoundingClientRect();
                                        const midY = rect.top + rect.height / 2;
                                        
                                        let dropIndex = songIndex;
                                        if (e.clientY > midY) {
                                            dropIndex = songIndex + 1;
                                        }

                                        if (dropIndicator?.index !== dropIndex || dropIndicator?.setlistId !== activeSetlistId) {
                                            dragOverSong.current = { setlistId: activeSetlistId as string, songIndex: dropIndex };
                                            setDropIndicator({ type: 'song', setlistId: activeSetlistId as string, index: dropIndex });
                                        }
                                    }}
                                    onDragEnd={handleSongDragEnd}>
                                    <div className="w-1.5 h-full" style={{backgroundColor: isPlaying ? 'var(--primary-accent)' : setlistColor}}></div>
                                    <div className="flex items-center justify-between flex-grow min-w-0 pl-[9px] pr-[15px]">
                                    <div className="flex items-center flex-grow min-w-0">
                                        {isEditMode && <span className="cursor-grab text-gray-500 p-1 mr-2"><DragHandleIcon /></span>}
                                        <span className="text-sm font-mono text-white/50 text-right shrink-0">{songIndex + 1}</span>
                                        <div className="flex-grow min-w-0 ml-3">
                                            {isRenaming ? (
                                                <input ref={inputRef} type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onKeyDown={handleEditKeyDown} onBlur={handleSaveName} className="bg-transparent text-white w-full outline-none font-medium" onClick={e => e.stopPropagation()} />
                                            ) : (
                                                <span className={`font-medium truncate ${isLoaded ? 'text-white' : 'text-gray-200 group-hover:text-white'}`} onDoubleClick={(e) => handleStartRename(e, song.id, song.name)}>{song.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 h-9">
                                        {isRenaming ? (
                                            <button onClick={(e) => { e.stopPropagation(); handleSaveName()}} className="px-4 h-9 flex items-center rounded-3xl bg-[var(--primary-accent)] text-black text-sm font-bold hover:bg-[var(--primary-accent-dark)] transition-colors" aria-label="Save changes">Save</button>
                                        ) : hasUnsavedChanges ? (
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.cancelChanges() }} className="px-4 h-9 flex items-center rounded-3xl bg-white/10 text-white/80 text-sm font-bold hover:bg-white/20 transition-colors" aria-label="Cancel changes">Cancel</button>
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.saveChanges()}} className="px-4 h-9 flex items-center rounded-3xl bg-[var(--primary-accent)] text-black text-sm font-bold hover:bg-[var(--primary-accent-dark)] transition-colors" aria-label="Save changes">Save</button>
                                            </div>
                                        ) : isEditMode ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => handleStartRename(e, song.id, song.name)} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-white/20 hover:text-white" aria-label="Rename song"><EditIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.duplicateSong(activeSetlistId as string, song.id) }} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-white/20 hover:text-white"><DuplicateIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setlistActions.deleteSong(activeSetlistId as string, song.id) }} className="p-2 rounded-full bg-black/20 text-gray-300 hover:bg-red-600/80 hover:text-white"><TrashIcon /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                {(() => {
                                                    const settings = song.settings as MetronomeSettings;
                                                    if (settings.isAdvanced) {
                                                        return (
                                                            <div title="Advanced Sequence" className="flex items-center">
                                                                <SequenceAdvancedIcon />
                                                            </div>
                                                        );
                                                    } else if (settings.simpleView === 'rings') {
                                                        return (
                                                            <div title="Ring Sequencer" className="flex items-center">
                                                                <SequenceRingIcon />
                                                            </div>
                                                        );
                                                    } else { 
                                                        return (
                                                            <div title="Grid Sequencer" className="flex items-center">
                                                                <SequenceGridIcon />
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                                <span className="text-sm text-gray-400 font-mono w-16 text-right tabular-nums">{bpm} BPM</span>
                                                <button onClick={(e) => {e.stopPropagation(); isPlaying ? handleStop() : handleLoadAndPlay(song, activeSetlistId as string)}} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isPlaying ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'}`} aria-label={isPlaying ? 'Stop' : 'Play'}>
                                                    {isPlaying ? <StopIcon /> : <SetlistPlayIcon />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {dropIndicator?.type === 'song' && dropIndicator.setlistId === activeSetlistId && dropIndicator.index === activeSetlist.songs.length && (
                        <div className="h-0.5 bg-white mx-[15px]"/>
                    )}
                    </>
                    }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetlistManager;