import React, { useState } from 'react'
import { SafeAreaView, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native'
import { generate } from './src/api'

export default function App() {
  const [prompt, setPrompt] = useState('Summarize this resume...')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const onGenerate = async () => {
    try {
      setLoading(true)
      const resp = await generate(prompt)
      setResult(JSON.stringify(resp, null, 2))
    } catch (e: any) {
      setResult(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Resume Parser Demo</Text>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <Button title={loading ? 'Running...' : 'Generate'} onPress={onGenerate} disabled={loading} />
        <Text style={styles.output}>{result}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { minHeight: 80, borderColor: '#ccc', borderWidth: 1, padding: 8, marginBottom: 12 },
  output: { marginTop: 12, fontFamily: 'monospace' },
})
