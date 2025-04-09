'use client'

import React, { useState, useRef, useEffect } from 'react';

interface Props {
    toggle: boolean;
    setToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

function Story({ toggle, setToggle }: Props) {
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [videoURLs, setVideoURLs] = useState<string[]>([]);
    const [videoDurations, setVideoDurations] = useState<number[]>([]); // Store durations for each video
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const progressRefs = useRef<HTMLDivElement[]>([]); // Keep references for multiple progress bars
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    useEffect(() => {
        // Cleanup when component unmounts or videoURLs changes
        return () => {
            videoURLs.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [videoURLs]);

    useEffect(() => {
        if (!toggle) {
            // Stop video and reset when closing
            if (videoRef.current) {
                setCurrentVideoIndex(0);
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
            resetStates();
        } else if (toggle) {
            if (videoRef.current) {
                videoRef.current.play();
                videoRef.current.currentTime = 0;
            }
            resetStates();
        }
    }, [toggle]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const files = e.target.files;
        if (!files) return;

        setError('');
        resetStates();

        const validFiles: File[] = [];
        const validURLs: string[] = [];
        const durations: number[] = [];

        Array.from(files).forEach((file) => {
            const isVideo = file.type.startsWith("video/") ||
                file.type === 'video/x-matroska' ||
                file.name.toLowerCase().endsWith('.mkv');

            if (isVideo) {
                validFiles.push(file);
                validURLs.push(URL.createObjectURL(file));
                durations.push(0); // Add a default duration to track it
            } else {
                setError('Some files were not valid video files (MP4, MOV, MKV)');
            }
        });

        // Append new videos to existing state
        setVideoFiles((prevFiles) => [...prevFiles, ...validFiles]);
        setVideoURLs((prevURLs) => [...prevURLs, ...validURLs]);
        setVideoDurations((prevDurations) => [...prevDurations, ...durations]);
        setCurrentVideoIndex(0);  // Start with the first video after upload
    };


    const resetStates = () => {
        setIsPlaying(false);
        if (progressRefs.current[currentVideoIndex]) {
            progressRefs.current[currentVideoIndex].style.width = '0%';
            progressRefs.current[currentVideoIndex].style.transition = 'none';
        }
    };

    const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const videoElement = e.target as HTMLVideoElement;
        const newDurations = [...videoDurations];
        newDurations[currentVideoIndex] = videoElement.duration; // Update the duration for the current video
        setVideoDurations(newDurations);
    };

    const handleVideoPlay = () => {
        setIsPlaying(true);
        if (progressRefs.current[currentVideoIndex] && videoDurations[currentVideoIndex] > 0) {
            // Apply transition after video starts playing and duration is available
            progressRefs.current[currentVideoIndex].style.transition = `width ${videoDurations[currentVideoIndex]}s linear`;
            progressRefs.current[currentVideoIndex].style.width = '100%';
        }
    };

    const handleVideoEnded = () => {
        if (currentVideoIndex < videoURLs.length - 1) {
            setCurrentVideoIndex(prev => prev + 1);
            if (progressRefs.current[currentVideoIndex]) {
                progressRefs.current[currentVideoIndex].style.width = '0%';
                progressRefs.current[currentVideoIndex].style.transition = 'none';
            }
        } else {
            // Do not change toggle state on video end (unless you want to close the player)
            setToggle(false);
        }
    };

    const updateProgress = () => {
        if (videoRef.current && progressRefs.current[currentVideoIndex]) {
            const currentTime = videoRef.current.currentTime;
            const progress = (currentTime / videoDurations[currentVideoIndex]) * 100;
            progressRefs.current[currentVideoIndex].style.width = `${progress}%`;
        }
    };

    useEffect(() => {
        // Start tracking video progress
        const video = videoRef.current;
        let progressInterval: NodeJS.Timeout | null = null;

        if (video) {
            progressInterval = setInterval(updateProgress, 100); // Update progress every 100ms

            video.addEventListener('play', () => {
                // Ensure progress bar starts after the video begins playing
                setIsPlaying(true);
            });

            video.addEventListener('pause', () => {
                clearInterval(progressInterval!);
            });

            video.addEventListener('ended', () => {
                clearInterval(progressInterval!);
            });
        }

        return () => {
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        };
    }, [videoDurations, currentVideoIndex]);

    console.log('videoURLs', videoURLs)

    return (
        <>
            <div
                onClick={(e) => {
                    e.preventDefault();
                    setToggle(false);
                }}
                className={`absolute bg-[rgba(0,0,0,0.5)] inset-0 ${toggle ? 'flex' : 'hidden'} justify-center`}
            >
                <div className='relative w-[400px] h-screen bg-black flex justify-center items-center cursor-pointer'>
                    {videoFiles.length > 0 ? (
                        <>
                            {/* Video Progress Bars */}
                            <div dir='rtl' className='absolute top-0 inset-x-0 p-4'>
                                <div className='w-full h-1 rounded-xl bg-gray-700'>
                                    {
                                        videoURLs.map((_, index) => (
                                            <div
                                                key={index}
                                                ref={(el) => {
                                                    if (el) {
                                                        progressRefs.current[index] = el;
                                                    }
                                                }}
                                                className="h-1 rounded-xl bg-white w-0"
                                            />
                                        ))
                                    }

                                </div>
                            </div>

                            {/* Video Carousel */}
                            <div className='absolute inset-0 w-full h-full' onClick={(e) => e.stopPropagation()}>
                                <video
                                    ref={videoRef}
                                    className='w-full h-full object-contain'
                                    key={videoURLs[currentVideoIndex]}
                                    onError={() => setError('Error loading video - try a different format')}
                                    autoPlay
                                    onLoadedMetadata={handleVideoMetadata}
                                    onPlay={handleVideoPlay}
                                    onEnded={handleVideoEnded}
                                >
                                    <source
                                        src={videoURLs[currentVideoIndex]}
                                        type={videoFiles[currentVideoIndex]?.type || 'video/x-matroska'}
                                    />
                                    Your browser does not support video playback
                                </video>
                            </div>

                            {/* Navigation Controls */}
                            <div className='absolute top-1/2 left-0 p-4'>
                                <button
                                    className='bg-white text-black px-2 py-1 rounded'
                                    onClick={() => setCurrentVideoIndex(prev => Math.max(prev - 1, 0))}
                                >
                                    Previous
                                </button>
                            </div>
                            <div className='absolute top-1/2 right-0 p-4'>
                                <button
                                    className='bg-white text-black px-2 py-1 rounded'
                                    onClick={() => setCurrentVideoIndex(prev => Math.min(prev + 1, videoURLs.length - 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    ) : (
                        <span className='text-white'>Click to upload</span>
                    )}

                    <div dir='rtl' className='absolute bottom-0 inset-x-0 p-4'>
                        <div className='w-full h-8 rounded-full border text-white px-4 flex items-center border-white'>
                            <input
                                type="text"
                                placeholder='نظر'
                                className='w-full bg-transparent outline-none'
                            />
                        </div>
                    </div>

                    {error && (
                        <div className='absolute bottom-4 text-red-500 text-sm bg-white px-4 py-2 rounded'>
                            {error}
                        </div>
                    )}
                </div>
            </div>
            <input
                type="file"
                accept="video/*, video/x-matroska"
                onChange={handleFileChange}
                ref={fileInputRef}
                className='hidden'
                multiple
            />
            <div
                className='p-2 rounded-lg bg-blue-400 text-white'
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
            >
                upload your video
            </div>
        </>
    );
}

export default Story;