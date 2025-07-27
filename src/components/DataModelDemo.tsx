'use client'

import React, { useState } from 'react'
import { 
  CreateLeagueInput, 
  CreateTeamInput, 
  CreateContestantInput,
  ValidationResult 
} from '../types'
import { 
  validateCreateLeagueInput, 
  validateCreateTeamInput, 
  validateCreateContestantInput 
} from '../lib/validation'

export const DataModelDemo: React.FC = () => {
  const [leagueData, setLeagueData] = useState<CreateLeagueInput>({
    name: '',
    season: ''
  })
  const [teamData, setTeamData] = useState<CreateTeamInput>({
    leagueId: 'demo-league',
    name: ''
  })
  const [contestantData, setContestantData] = useState<CreateContestantInput>({
    leagueId: 'demo-league',
    name: '',
    age: undefined,
    hometown: '',
    occupation: '',
    bio: ''
  })

  const [leagueValidation, setLeagueValidation] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [teamValidation, setTeamValidation] = useState<ValidationResult>({ isValid: true, errors: [] })
  const [contestantValidation, setContestantValidation] = useState<ValidationResult>({ isValid: true, errors: [] })

  const handleLeagueChange = (field: keyof CreateLeagueInput, value: string) => {
    const newData = { ...leagueData, [field]: value }
    setLeagueData(newData)
    setLeagueValidation(validateCreateLeagueInput(newData))
  }

  const handleTeamChange = (field: keyof CreateTeamInput, value: string) => {
    const newData = { ...teamData, [field]: value }
    setTeamData(newData)
    setTeamValidation(validateCreateTeamInput(newData))
  }

  const handleContestantChange = (field: keyof CreateContestantInput, value: string | number | undefined) => {
    const newData = { ...contestantData, [field]: value }
    setContestantData(newData)
    setContestantValidation(validateCreateContestantInput(newData))
  }

  const getFieldError = (validation: ValidationResult, fieldName: string) => {
    return validation.errors.find(error => error.field === fieldName)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Models Demo</h1>
        <p className="text-gray-600">
          This demo shows TypeScript interfaces and real-time validation working in forms.
          Try entering invalid data to see validation errors appear instantly.
        </p>
      </div>

      {/* League Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create League</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              League Name *
            </label>
            <input
              type="text"
              value={leagueData.name}
              onChange={(e) => handleLeagueChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError(leagueValidation, 'name') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter league name"
            />
            {getFieldError(leagueValidation, 'name') && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError(leagueValidation, 'name')?.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season *
            </label>
            <input
              type="text"
              value={leagueData.season}
              onChange={(e) => handleLeagueChange('season', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError(leagueValidation, 'season') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Grant Ellis 2025"
            />
            {getFieldError(leagueValidation, 'season') && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError(leagueValidation, 'season')?.message}
              </p>
            )}
          </div>

          <div className={`p-3 rounded-md ${leagueValidation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-medium ${leagueValidation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              Validation Status: {leagueValidation.isValid ? '✅ Valid' : '❌ Invalid'}
            </p>
            {!leagueValidation.isValid && (
              <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                {leagueValidation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Team Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Team</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              value={teamData.name}
              onChange={(e) => handleTeamChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError(teamValidation, 'name') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter team name (try using < or > to see validation)"
            />
            {getFieldError(teamValidation, 'name') && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError(teamValidation, 'name')?.message}
              </p>
            )}
          </div>

          <div className={`p-3 rounded-md ${teamValidation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-medium ${teamValidation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              Validation Status: {teamValidation.isValid ? '✅ Valid' : '❌ Invalid'}
            </p>
            {!teamValidation.isValid && (
              <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                {teamValidation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Contestant Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Contestant</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={contestantData.name}
                onChange={(e) => handleContestantChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError(contestantValidation, 'name') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contestant name"
              />
              {getFieldError(contestantValidation, 'name') && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError(contestantValidation, 'name')?.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={contestantData.age || ''}
                onChange={(e) => handleContestantChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError(contestantValidation, 'age') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter age (try 15 to see validation)"
                min="18"
                max="65"
              />
              {getFieldError(contestantValidation, 'age') && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError(contestantValidation, 'age')?.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hometown
              </label>
              <input
                type="text"
                value={contestantData.hometown || ''}
                onChange={(e) => handleContestantChange('hometown', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New York, NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                value={contestantData.occupation || ''}
                onChange={(e) => handleContestantChange('occupation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Teacher"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={contestantData.bio || ''}
              onChange={(e) => handleContestantChange('bio', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError(contestantValidation, 'bio') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter bio (try typing more than 500 characters to see validation)"
              rows={3}
            />
            {getFieldError(contestantValidation, 'bio') && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError(contestantValidation, 'bio')?.message}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {(contestantData.bio || '').length}/500 characters
            </p>
          </div>

          <div className={`p-3 rounded-md ${contestantValidation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm font-medium ${contestantValidation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              Validation Status: {contestantValidation.isValid ? '✅ Valid' : '❌ Invalid'}
            </p>
            {!contestantValidation.isValid && (
              <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                {contestantValidation.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* TypeScript Interface Display */}
      <div className="bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">TypeScript Interfaces in Action</h2>
        <p className="text-gray-600 mb-4">
          The forms above use strongly-typed TypeScript interfaces. Here's what the data looks like:
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">League Data:</h3>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
              {JSON.stringify(leagueData, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Team Data:</h3>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
              {JSON.stringify(teamData, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Contestant Data:</h3>
            <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
              {JSON.stringify(contestantData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}