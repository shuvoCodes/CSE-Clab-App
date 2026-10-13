import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { checkForRequiredUpdate } from './updateChecker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import rules from './assets/data/rules.json';
import rooms from './assets/data/rooms.json';
import routine from './assets/data/routine.json';
import teachers from './assets/data/teachers.json';
const courseHandbookPdf = require('./assets/pdfs/OBECSE.pdf');
const routineSourcePdf = require('./assets/pdfs/Class-Routine-Fall-2026.pdf');

const STORAGE_KEY = '@class-routine/settings';
const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
const PERIODS = [
  { label: '1st', startTime: '09:30', endTime: '10:45' },
  { label: '2nd', startTime: '10:45', endTime: '12:00' },
  { label: '3rd', startTime: '12:00', endTime: '13:15' },
  { label: '4th', startTime: '14:00', endTime: '15:15' },
  { label: '5th', startTime: '15:15', endTime: '16:30' },
];
const BATCHES = [
  { id: '24th', label: 'Batch 24', semester: '8th' },
  { id: '25th', label: 'Batch 25', semester: '7th' },
  { id: '26th', label: 'Batch 26', semester: '6th' },
  { id: '27th', label: 'Batch 27', semester: '5th' },
  { id: '28th', label: 'Batch 28', semester: '4th' },
  { id: '29th', label: 'Batch 29', semester: '3rd' },
  { id: '30th', label: 'Batch 30', semester: '2nd' },
  { id: '31st', label: 'Batch 31', semester: '1st' },
];
const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

const LIGHT = {
  background: '#F4F2FB',
  surface: '#FFFFFF',
  ink: '#1E1B3A',
  muted: '#6F6B99',
  navIdle: '#A9A5D6',
  primary: '#5B4FE9',
  primaryTint: '#EDEAFF',
  busyBg: '#FFE9E7',
  busyText: '#B42318',
  freeBg: '#E2F7EC',
  freeText: '#17714A',
  busyDot: '#E5483B',
  freeDot: '#2BB673',
  border: '#E9E6F2',
  cardShadow: 'rgba(91,79,233,0.08)',
  input: '#FFFFFF',
  nav: '#1E1B3A',
  white: '#FFFFFF',
};
const DARK = {
  background: '#13121E',
  surface: '#211F31',
  ink: '#F3F0FF',
  muted: '#AAA5C9',
  navIdle: '#AAA5C9',
  primary: '#8A80FF',
  primaryTint: '#322E51',
  busyBg: '#452626',
  busyText: '#FFABA4',
  freeBg: '#1E3B30',
  freeText: '#84E0B0',
  busyDot: '#FF6C62',
  freeDot: '#4AD394',
  border: '#36334A',
  cardShadow: 'rgba(0,0,0,0.18)',
  input: '#211F31',
  nav: '#211F31',
  white: '#FFFFFF',
};

const SCHEDULE = routine;
const teacherNameFor = (shortName) => teachers.find((teacher) => teacher.shortName === shortName)?.name ?? shortName;
const entryMeta = (entry) =>
  [entry.courseCode, entry.section ? `Sec ${entry.section}` : null, entry.teacherShort ? `${entry.teacherShort}: ${teacherNameFor(entry.teacherShort)}` : null]
    .filter(Boolean)
    .join(' · ');

const currentDay = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
const firstClassDay = () => (DAYS.includes(currentDay()) ? currentDay() : DAYS[0]);

const initialsFor = (name) => {
  const words = name.trim().split(/\s+/);
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    : words[0].slice(0, 2).toUpperCase();
};

const minuteOfDay = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatPeriodTime = (value) => {
  const [hourText, minutes] = value.split(':');
  const hour = Number(hourText);
  return `${String(hour % 12 || 12).padStart(2, '0')}:${minutes}${hour >= 12 ? 'PM' : 'AM'}`;
};

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

const getNowClass = (entries, date) => {
  const minute = date.getHours() * 60 + date.getMinutes();
  return entries.find((entry) => minute >= minuteOfDay(entry.startTime) && minute < minuteOfDay(entry.endTime));
};

const IconButton = ({ icon, onPress, colors, label }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.primaryTint, opacity: pressed ? 0.7 : 1 }]}
  >
    <Ionicons name={icon} size={20} color={colors.primary} />
  </Pressable>
);

const ScreenHeading = ({ title, subtitle, colors, onSettings }) => (
  <View style={styles.headingRow}>
    <View style={styles.headingText}>
      <Text style={[styles.screenTitle, { color: colors.ink }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
    {onSettings ? <IconButton icon="settings-outline" label="Settings" onPress={onSettings} colors={colors} /> : null}
  </View>
);

const Chip = ({ label, selected, onPress, colors, disabled = false }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      {
        backgroundColor: selected ? colors.primary : colors.surface,
        opacity: disabled ? 0.6 : pressed ? 0.75 : 1,
        borderColor: selected ? colors.primary : colors.border,
      },
    ]}
  >
    <Text style={[styles.chipText, { color: selected ? colors.white : colors.muted }]}>{label}</Text>
  </Pressable>
);

const Card = ({ children, colors, style }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: colors.cardShadow,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const BottomNav = ({ active, onNavigate, colors }) => {
  const tabs = [
    { id: 'Routine', icon: 'calendar-outline' },
    { id: 'Rooms', icon: 'grid-outline' },
    { id: 'Home', icon: 'home-outline' },
    { id: 'Teachers', icon: 'person-outline' },
    { id: 'Rules', icon: 'shield-checkmark-outline' },
  ];
  return (
    <View style={[styles.navBar, { backgroundColor: colors.nav }]}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={tab.id}
            accessibilityState={{ selected }}
            onPress={() => onNavigate(tab.id)}
            style={[styles.navItem, selected && { backgroundColor: colors.primary }]}
          >
            <Ionicons name={tab.icon} size={20} color={selected ? colors.white : colors.navIdle} />
            {selected && <Text style={styles.navLabel}>{tab.id}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
};

const PeriodRow = ({ entry, colors, past = false }) => (
  <Card colors={colors} style={[styles.periodCard, past && styles.pastPeriod]}>
    <View style={styles.periodTopline}>
      <View style={[styles.periodBadge, { backgroundColor: colors.primaryTint }]}>
        <Text style={[styles.periodBadgeText, { color: colors.primary }]}>{entry.period}</Text>
      </View>
      <Text style={[styles.periodTime, { color: colors.muted }]}>
        {formatPeriodTime(entry.startTime)} – {formatPeriodTime(entry.endTime)}
      </Text>
    </View>
    <Text style={[styles.periodTitle, { color: colors.ink }]}>{entry.courseTitle}</Text>
    {entryMeta(entry) ? <Text style={[styles.periodMeta, { color: colors.muted }]}>{entryMeta(entry)}</Text> : null}
    {entry.room ? (
      <View style={styles.roomLine}>
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text style={[styles.roomText, { color: colors.muted }]}>{entry.room}</Text>
      </View>
    ) : null}
  </Card>
);

const GreetingCard = ({ colors, now }) => {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateText = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <View style={[styles.greeting, { backgroundColor: colors.primary }]}>
      <View style={styles.greetingCircle} />
      <Text style={styles.greetingLabel}>{greeting}</Text>
      <View style={styles.greetingBottom}>
        <Text style={styles.clock}>{formatTime(now).replace(' ', ' ')}</Text>
        <Text style={styles.greetingDate}>{dateText}</Text>
      </View>
    </View>
  );
};

const SetupScreen = ({ colors, initial, onContinue }) => {
  const [semester, setSemester] = useState(initial?.semester || '3rd');
  const [batch, setBatch] = useState(initial?.batch || '29th');
  return (
    <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.setupIcon, { backgroundColor: colors.primary }]}>
        <Ionicons name="calendar-outline" size={30} color={colors.white} />
      </View>
      <Text style={[styles.setupTitle, { color: colors.ink }]}>Set up your routine</Text>
      <Text style={[styles.setupDescription, { color: colors.muted }]}>Pick once. Everything works offline.</Text>
      <Text style={[styles.sectionLabel, { color: colors.ink }]}>Semester</Text>
      <View style={styles.semesterGrid}>
        {SEMESTERS.map((item) => (
          <View key={item} style={styles.semesterGridCell}>
            <Chip label={item} selected={semester === item} onPress={() => setSemester(item)} colors={colors} />
          </View>
        ))}
      </View>
      <Text style={[styles.sectionLabel, styles.batchHeading, { color: colors.ink }]}>Batch</Text>
      <View style={styles.setupBatchWrap}>
        {BATCHES.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={batch === item.id}
            onPress={() => {
              setBatch(item.id);
              setSemester(item.semester);
            }}
            colors={colors}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => onContinue({ batch, semester, theme: initial?.theme || 'light' })}
        style={({ pressed }) => [styles.continueButton, { backgroundColor: colors.ink, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.continueText}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.white} />
      </Pressable>
    </ScrollView>
  );
};

const HomeScreen = ({ colors, settings, onSettings, now, onQuestionBank, onUpload }) => {
  const day = currentDay();
  const entries = SCHEDULE.filter((entry) =>
    entry.day === day && entry.batch === settings.batch && entry.semester === settings.semester,
  ).sort((a, b) => minuteOfDay(a.startTime) - minuteOfDay(b.startTime));
  const current = getNowClass(entries, now);
  const next = entries.find((entry) => minuteOfDay(entry.startTime) > now.getHours() * 60 + now.getMinutes());
  const finished = entries.length > 0 && !current && !next;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeading title="" colors={colors} onSettings={onSettings} />
        <GreetingCard colors={colors} now={now} />
        <Card colors={colors} style={[styles.currentCard, { borderColor: colors.primary }]}>
          <View style={styles.currentTopline}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>Current class</Text>
            <View style={[styles.nowChip, { backgroundColor: colors.primaryTint }]}>
              <Text style={[styles.nowChipText, { color: colors.primary }]}>
                {current ? `${current.period} period · Now` : next ? 'Coming up' : 'Today'}
              </Text>
            </View>
          </View>
          {current ? (
            <>
              <Text style={[styles.periodTime, { color: colors.muted }]}>
                {formatPeriodTime(current.startTime)} – {formatPeriodTime(current.endTime)}
              </Text>
              {current.courseCode ? (
                <Text style={[styles.periodMeta, { color: colors.muted }]}>
                  {current.courseCode}{current.room ? `  Room ${current.room}` : ''}
                </Text>
              ) : null}
              <Text style={[styles.currentTitle, { color: colors.ink }]}>{current.courseTitle}</Text>
              {current.teacherShort ? (
                <Text style={[styles.periodMeta, { color: colors.muted }]}>
                  {current.teacherShort}: {teacherNameFor(current.teacherShort)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.emptyMessage, { color: colors.muted }]}>
              {entries.length === 0
                ? 'N/A'
                : next && now.getHours() * 60 + now.getMinutes() < minuteOfDay(entries[0].startTime)
                  ? `Classes have not started. First class begins at ${formatPeriodTime(next.startTime)}.`
                  : next
                    ? `Next class begins at ${formatPeriodTime(next.startTime)}.`
                  : finished
                    ? 'Classes are over for today.'
                    : 'No class is running right now.'}
            </Text>
          )}
        </Card>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Today’s classes</Text>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>{day}</Text>
        </View>
        {entries.length ? entries.map((entry) => (
          <PeriodRow
            key={`${entry.day}-${entry.batch}-${entry.section}-${entry.period}-${entry.courseCode}`}
            entry={entry}
            colors={colors}
            past={minuteOfDay(entry.endTime) <= now.getHours() * 60 + now.getMinutes()}
          />
        )) : <Card colors={colors}><Text style={[styles.emptyMessage, { color: colors.muted }]}>N/A</Text></Card>}
        <Pressable
          accessibilityRole="button"
          onPress={onQuestionBank}
          style={({ pressed }) => [styles.questionCard, { backgroundColor: colors.nav, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.questionIcon}><Ionicons name="book-outline" size={20} color={colors.white} /></View>
          <View style={styles.questionText}>
            <Text style={styles.questionTitle}>Question Bank</Text>
            <Text style={styles.questionCaption}>Opens website · needs internet</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.navIdle} />
        </Pressable>
        <Pressable onPress={onUpload} style={styles.uploadLink}>
          <Ionicons name="cloud-upload-outline" size={17} color={colors.primary} />
          <Text style={[styles.uploadLinkText, { color: colors.primary }]}>Upload new routine</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const RoutineScreen = ({ colors, settings, onSettings }) => {
  const [day, setDay] = useState(firstClassDay);
  const [batch, setBatch] = useState(settings.batch);
  const selectedBatch = BATCHES.find((item) => item.id === batch);
  const entries = SCHEDULE.filter((entry) =>
    entry.day === day && entry.batch === batch && entry.semester === selectedBatch?.semester,
  ).sort((a, b) => minuteOfDay(a.startTime) - minuteOfDay(b.startTime));
  return (
    <PageLayout title="Routine" colors={colors} onSettings={onSettings}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
        {BATCHES.map((item) => (
          <Chip
            key={item.id}
            label={`${item.label} · ${item.semester}`}
            selected={batch === item.id}
            onPress={() => setBatch(item.id)}
            colors={colors}
          />
        ))}
      </ScrollView>
      <View style={[styles.dayTabs, { backgroundColor: colors.surface }]}>
        {DAYS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setDay(item)}
            style={[styles.dayTab, day === item && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.dayTabText, { color: day === item ? colors.white : colors.muted }]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.sectionCaption, styles.routineCaption, { color: colors.muted }]}>
        Full routine · Fall 2026 · {selectedBatch?.label} · {selectedBatch?.semester} semester
      </Text>
      {entries.length ? entries.map((entry) => (
        <PeriodRow key={`${entry.day}-${entry.batch}-${entry.section}-${entry.period}-${entry.courseCode}`} entry={entry} colors={colors} />
      )) : <EmptyCard colors={colors} message="N/A" detail="There is no saved routine for this batch and semester." />}
    </PageLayout>
  );
};

const PageLayout = ({ title, subtitle, colors, onSettings, children }) => (
  <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeading title={title} subtitle={subtitle} colors={colors} onSettings={onSettings} />
      {children}
    </ScrollView>
  </View>
);

const EmptyCard = ({ colors, message, detail }) => (
  <Card colors={colors}>
    <Text style={[styles.emptyMessage, { color: colors.muted }]}>{message}</Text>
    {detail ? <Text style={[styles.emptyDetail, { color: colors.muted }]}>{detail}</Text> : null}
  </Card>
);

const RoomsScreen = ({ colors, onSettings, now }) => {
  const [day, setDay] = useState(firstClassDay);
  const [room, setRoom] = useState(rooms[0]);
  const selectedClasses = SCHEDULE.filter((entry) => entry.day === day && entry.room === room)
    .sort((a, b) => minuteOfDay(a.startTime) - minuteOfDay(b.startTime));
  const activeEntry = getNowClass(SCHEDULE.filter((entry) => entry.day === currentDay() && entry.room === room), now);
  const time = now.getHours() * 60 + now.getMinutes();
  return (
    <PageLayout title="Rooms" colors={colors} onSettings={onSettings}>
      <View style={styles.roomControls}>
        <Pressable
          onPress={() => setDay((current) => DAYS[(DAYS.indexOf(current) + 1) % DAYS.length])}
          style={[styles.dayPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.dayPickerText, { color: colors.ink }]}>{day}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
        </Pressable>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.busyDot }]} /><Text style={[styles.legendText, { color: colors.muted }]}>Busy</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.freeDot }]} /><Text style={[styles.legendText, { color: colors.muted }]}>Free</Text></View>
        </View>
      </View>
      <View style={styles.roomGrid}>
        {rooms.map((item) => {
          const active = SCHEDULE.find((entry) => entry.day === currentDay() && entry.room === item &&
            time >= minuteOfDay(entry.startTime) && time < minuteOfDay(entry.endTime));
          const busy = Boolean(active);
          const selected = item === room;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${item}, ${busy ? 'Busy' : 'Free'}`}
              onPress={() => setRoom(item)}
              style={({ pressed }) => [
                styles.roomTile,
                { backgroundColor: busy ? colors.busyBg : colors.freeBg, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.roomNumber, { color: colors.ink }]}>{item}</Text>
              <Text style={[styles.roomStatus, { color: busy ? colors.busyText : colors.freeText }]}>{busy ? 'Busy' : 'Free'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Card colors={colors} style={styles.roomDetail}>
        <View style={styles.currentTopline}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>Room {room}</Text>
          <View style={[styles.nowChip, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.nowChipText, { color: colors.primary }]}>{day}</Text>
          </View>
        </View>
        {selectedClasses.length ? selectedClasses.map((entry) => (
          <View key={`${entry.day}-${entry.batch}-${entry.section}-${entry.period}-${entry.courseCode}`} style={styles.roomScheduleRow}>
            <Text style={[styles.periodTime, { color: colors.muted }]}>
              {formatPeriodTime(entry.startTime)} – {formatPeriodTime(entry.endTime)}
            </Text>
            <Text style={[styles.roomScheduleMeta, { color: colors.muted }]}>
              Batch {entry.batch.replace(/(st|nd|rd|th)$/, '')} · {entry.semester} Sem
              {entry.section ? ` · Sec ${entry.section}` : ''}
            </Text>
            <Text style={[styles.periodTitle, { color: colors.ink }]}>{entry.courseTitle}</Text>
            {entry.teacherShort ? (
              <Text style={[styles.periodMeta, { color: colors.muted }]}>
                {entry.teacherShort}: {teacherNameFor(entry.teacherShort)}
              </Text>
            ) : null}
          </View>
        )) : <Text style={[styles.emptyMessage, { color: colors.muted }]}>N/A</Text>}
        {activeEntry && <Text style={[styles.roomLive, { color: colors.busyText }]}>Busy now · {activeEntry.period} period</Text>}
      </Card>
    </PageLayout>
  );
};

const TeachersScreen = ({ colors, onSettings }) => {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('2nd');
  const [teacher, setTeacher] = useState(null);
  const todayEntries = SCHEDULE.filter((entry) => entry.day === currentDay())
    .sort((a, b) => minuteOfDay(a.startTime) - minuteOfDay(b.startTime));
  const selectedPeriod = PERIODS.find((item) => item.label === period);
  const shownTeachers = teachers.filter((item) =>
    `${item.name} ${item.shortName}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const teacherEntries = teacher
    ? todayEntries.filter((entry) => entry.teacherShort === teacher.shortName)
    : [];
  return (
    <PageLayout title={teacher ? teacher.name : 'Teachers'} subtitle={teacher ? 'Today’s routine' : undefined} colors={colors} onSettings={onSettings}>
      {teacher ? (
        <>
          <Pressable onPress={() => setTeacher(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={17} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>All teachers</Text>
          </Pressable>
          {teacherEntries.length ? teacherEntries.map((entry) => (
            <PeriodRow key={`${entry.day}-${entry.batch}-${entry.section}-${entry.period}-${entry.courseCode}`} entry={entry} colors={colors} />
          )) : <EmptyCard colors={colors} message="N/A" />}
        </>
      ) : (
        <>
          <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={19} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search teachers"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.ink }]}
              accessibilityLabel="Search teachers"
            />
          </View>
          <View style={styles.periodChips}>
            {PERIODS.map((item) => (
              <Chip key={item.label} label={item.label} selected={item.label === period} onPress={() => setPeriod(item.label)} colors={colors} />
            ))}
          </View>
          <Text style={[styles.sectionCaption, styles.teacherCaption, { color: colors.muted }]}>
            {selectedPeriod
              ? `Status at ${period} period · ${formatPeriodTime(selectedPeriod.startTime)} – ${formatPeriodTime(selectedPeriod.endTime)}`
              : `Status at ${period} period`}
          </Text>
          {shownTeachers.map((person) => {
            const busyClass = todayEntries.find((entry) => {
              const currentPeriod = entry.period === period;
              return currentPeriod && entry.teacherShort === person.shortName;
            });
            const isBusy = Boolean(busyClass);
            return (
              <Pressable key={person.shortName} onPress={() => setTeacher(person)}>
                <Card colors={colors} style={styles.teacherCard}>
                  <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{initialsFor(person.name)}</Text>
                  </View>
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, { color: colors.ink }]}>{person.name}</Text>
                    <Text style={[styles.teacherShort, { color: colors.muted }]}>{person.shortName}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: isBusy ? colors.busyBg : colors.freeBg }]}>
                    <Text style={[styles.statusText, { color: isBusy ? colors.busyText : colors.freeText }]}>
                      {isBusy ? `Busy · ${busyClass.room || 'Room unavailable'}` : 'Available'}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
          {shownTeachers.length === 0 && <EmptyCard colors={colors} message="No teachers found" />}
        </>
      )}
    </PageLayout>
  );
};

const RulesScreen = ({ colors, onSettings }) => (
  <PageLayout title="Rules" subtitle="Campus & class rules" colors={colors} onSettings={onSettings}>
    {rules.map((rule) => (
      <Card key={rule.id} colors={colors} style={styles.ruleCard}>
        <View style={[styles.ruleNumber, { backgroundColor: colors.primaryTint }]}>
          <Text style={[styles.ruleNumberText, { color: colors.primary }]}>{rule.id}</Text>
        </View>
        <View style={styles.ruleContent}>
          <Text style={[styles.ruleTitle, { color: colors.ink }]}>{rule.title}</Text>
          <Text style={[styles.ruleText, { color: colors.muted }]}>{rule.text}</Text>
        </View>
      </Card>
    ))}
  </PageLayout>
);

const SettingsScreen = ({ colors, settings, onBack, onChange, onUpload }) => (
  <PageLayout title="Settings" colors={colors}>
    <Pressable onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={17} color={colors.primary} />
      <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
    </Pressable>
    <Text style={[styles.sectionLabel, { color: colors.ink }]}>Appearance</Text>
    <Card colors={colors} style={styles.settingsCard}>
      <Text style={[styles.settingsTitle, { color: colors.ink }]}>Theme</Text>
      <Text style={[styles.settingsDescription, { color: colors.muted }]}>Choose how Class Routine looks on this device.</Text>
      <View style={styles.themeChoices}>
        {[
          { id: 'light', label: 'Light', icon: 'sunny-outline' },
          { id: 'dark', label: 'Dark', icon: 'moon-outline' },
        ].map((option) => {
          const selected = settings.theme === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange({ ...settings, theme: option.id })}
              style={[styles.themeOption, { backgroundColor: selected ? colors.primaryTint : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Ionicons name={option.icon} size={20} color={selected ? colors.primary : colors.muted} />
              <Text style={[styles.themeOptionText, { color: selected ? colors.primary : colors.ink }]}>{option.label}</Text>
              {selected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </Card>
    <Text style={[styles.sectionLabel, styles.settingsSectionLabel, { color: colors.ink }]}>Your routine</Text>
    <Card colors={colors} style={styles.settingsCard}>
      <Text style={[styles.settingsTitle, { color: colors.ink }]}>Batch {settings.batch} · {settings.semester} semester</Text>
      <Text style={[styles.settingsDescription, { color: colors.muted }]}>Your batch stays fixed. Update your semester as you progress.</Text>
      <View style={styles.settingsSemesters}>
        {SEMESTERS.map((semester) => (
          <Chip
            key={semester}
            label={semester}
            selected={settings.semester === semester}
            onPress={() => onChange({ ...settings, semester })}
            colors={colors}
          />
        ))}
      </View>
    </Card>
    <Pressable
      onPress={() => {
        const bundledPdfCount = [courseHandbookPdf, routineSourcePdf].length;
        Alert.alert('Offline reference PDFs', `${bundledPdfCount} PDF files are bundled: the OBECSE course handbook and Fall 2026 routine.`);
      }}
      style={[styles.uploadSettings, { borderColor: colors.border, marginBottom: 18 }]}
    >
      <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      <Text style={[styles.uploadSettingsText, { color: colors.primary }]}>PDF references included</Text>
    </Pressable>
    <Pressable
      accessibilityRole="button"
      onPress={onUpload}
      style={[styles.uploadSettings, { borderColor: colors.border }]}
    >
      <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
      <Text style={[styles.uploadSettingsText, { color: colors.primary }]}>Upload new routine PDF</Text>
    </Pressable>
  </PageLayout>
);

const UpdateRequiredScreen = ({ colors, update, onUpdate }) => (
  <View style={[styles.updateScreen, { backgroundColor: colors.background }]}>
    <View style={[styles.setupIcon, { backgroundColor: colors.primary }]}>
      <Ionicons name="cloud-download-outline" size={30} color={colors.white} />
    </View>
    <Text style={[styles.setupTitle, styles.updateTitle, { color: colors.ink }]}>Update required</Text>
    <Text style={[styles.setupDescription, styles.updateDescription, { color: colors.muted }]}>
      HUB CSE Club {update.latestVersion} is available. Install the latest version to continue.
    </Text>
    <Pressable
      accessibilityRole="button"
      onPress={onUpdate}
      style={({ pressed }) => [styles.continueButton, { backgroundColor: colors.ink, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.continueText}>Update app</Text>
      <Ionicons name="open-outline" size={18} color={colors.white} />
    </Pressable>
  </View>
);

function AppContent() {
  const [settings, setSettings] = useState(null);
  const [screen, setScreen] = useState('Setup');
  const [returnScreen, setReturnScreen] = useState('Home');
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [updateChecked, setUpdateChecked] = useState(false);
  const [requiredUpdate, setRequiredUpdate] = useState(null);
  const updateCheckInProgress = useRef(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const colors = settings?.theme === 'dark' ? DARK : LIGHT;

  useEffect(() => {
    let mounted = true;
    const checkUpdate = async () => {
      if (updateCheckInProgress.current) return;
      updateCheckInProgress.current = true;
      try {
        const network = await NetInfo.fetch();
        if (!network.isConnected || network.isInternetReachable === false) return;
        const update = await checkForRequiredUpdate(
          Constants.expoConfig?.version,
          Constants.expoConfig?.extra?.updateManifestUrl,
        );
        if (mounted) setRequiredUpdate(update);
      } catch (error) {
        console.error('Could not check for app updates. Continuing with the installed version.', error);
      } finally {
        updateCheckInProgress.current = false;
        if (mounted) setUpdateChecked(true);
      }
    };

    void checkUpdate();
    let wasOnline = null;
    const unsubscribe = NetInfo.addEventListener((network) => {
      const online = network.isConnected && network.isInternetReachable !== false;
      if (online && wasOnline !== true) void checkUpdate();
      wasOnline = online;
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            BATCHES.some((batch) => batch.id === parsed.batch) &&
            SEMESTERS.includes(parsed.semester) &&
            ['light', 'dark'].includes(parsed.theme)
          ) {
            setSettings(parsed);
            setScreen('Home');
          }
        }
      })
      .catch((error) => {
        console.error('Could not load saved routine settings.', error);
        Alert.alert('Settings unavailable', 'Your saved settings could not be loaded. You can continue and set them again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const onSettingsChange = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
    } catch (error) {
      console.error('Could not save routine settings.', error);
      Alert.alert('Could not save settings', 'Please try again. Your current selection has not been changed.');
    }
  };

  const onSetupContinue = async (next) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
      setScreen('Home');
    } catch (error) {
      console.error('Could not save setup settings.', error);
      Alert.alert('Could not save setup', 'Please try again. Your choices have not been saved.');
    }
  };

  const onQuestionBank = async () => {
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      Alert.alert('Network not connected', 'Connect to the internet to open the Question Bank.');
      return;
    }
    const questionBankUrl = Constants.expoConfig?.extra?.questionBankUrl;
    if (!questionBankUrl) {
      Alert.alert('Question Bank', 'The Question Bank website URL has not been configured for this app.');
      return;
    }
    try {
      await Linking.openURL(questionBankUrl);
    } catch (error) {
      console.error('Could not open the Question Bank website.', error);
      Alert.alert('Could not open website', 'The Question Bank URL could not be opened on this device.');
    }
  };

  const onUpload = async () => {
    const network = await NetInfo.fetch();
    if (!network.isConnected) {
      Alert.alert('Network not connected', 'Connect to the internet before analyzing a new routine.');
      return;
    }
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
    } catch (error) {
      console.error('Could not open the routine PDF picker.', error);
      Alert.alert('Upload failed', 'The PDF picker could not be opened on this device.');
      return;
    }
    if (result.canceled) return;
    const file = result.assets[0];
    const routineDirectory = `${FileSystem.documentDirectory}routine/`;
    try {
      await FileSystem.makeDirectoryAsync(routineDirectory, { intermediates: true });
      await FileSystem.copyAsync({ from: file.uri, to: `${routineDirectory}pending-routine-${Date.now()}.pdf` });
      Alert.alert(
        'PDF selected',
        'The PDF is stored temporarily. Connect a routine-analysis AI service to validate and import its classes; your existing routine was not changed.',
      );
    } catch (error) {
      console.error('Could not store selected routine PDF.', error);
      Alert.alert('Upload failed', 'The selected PDF could not be stored on this device.');
    }
  };

  const openSettings = () => {
    setReturnScreen(screen);
    setScreen('Settings');
  };

  const openRequiredUpdate = async () => {
    try {
      await Linking.openURL(requiredUpdate.downloadUrl);
    } catch (error) {
      console.error('Could not open the HUB CSE Club release page.', error);
      Alert.alert('Could not open release page', 'Open the HUB CSE Club GitHub Releases page in your browser to install the update.');
    }
  };

  if (loading || !fontsLoaded || !updateChecked) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.app, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={settings?.theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {requiredUpdate ? (
        <UpdateRequiredScreen colors={colors} update={requiredUpdate} onUpdate={openRequiredUpdate} />
      ) : !settings ? (
        <SetupScreen colors={colors} initial={settings} onContinue={onSetupContinue} />
      ) : screen === 'Settings' ? (
        <>
          <SettingsScreen
            colors={colors}
            settings={settings}
            onBack={() => setScreen(returnScreen)}
            onChange={onSettingsChange}
            onUpload={onUpload}
          />
        </>
      ) : (
        <>
          {screen === 'Home' && <HomeScreen colors={colors} settings={settings} onSettings={openSettings} now={now} onQuestionBank={onQuestionBank} onUpload={onUpload} />}
          {screen === 'Routine' && <RoutineScreen colors={colors} settings={settings} onSettings={openSettings} />}
          {screen === 'Rooms' && <RoomsScreen colors={colors} onSettings={openSettings} now={now} />}
          {screen === 'Teachers' && <TeachersScreen colors={colors} onSettings={openSettings} />}
          {screen === 'Rules' && <RulesScreen colors={colors} onSettings={openSettings} />}
          <BottomNav active={screen} onNavigate={setScreen} colors={colors} />
        </>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1 },
  updateScreen: { flex: 1, justifyContent: 'center', padding: 24 },
  updateTitle: { maxWidth: '100%' },
  updateDescription: { marginBottom: 32 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 120 },
  setupScroll: { flexGrow: 1, paddingTop: 55, paddingHorizontal: 20, paddingBottom: 32 },
  headingRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headingText: { flex: 1 },
  screenTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, lineHeight: 36 },
  subtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, marginTop: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  setupIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  setupTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, lineHeight: 42, maxWidth: 310 },
  setupDescription: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, marginTop: 6, marginBottom: 38 },
  sectionLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, marginBottom: 12 },
  semesterGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  semesterGridCell: { width: '25%', paddingHorizontal: 4, marginBottom: 9 },
  chip: { minHeight: 40, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
  batchHeading: { marginTop: 27 },
  setupBatchWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 38 },
  continueButton: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto' },
  continueText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#FFFFFF' },
  greeting: { minHeight: 155, borderRadius: 28, padding: 20, marginBottom: 14, overflow: 'hidden', justifyContent: 'space-between' },
  greetingCircle: { position: 'absolute', width: 138, height: 138, borderRadius: 69, right: -24, top: -48, backgroundColor: 'rgba(255,255,255,0.12)' },
  greetingLabel: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 },
  greetingBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  clock: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 34, lineHeight: 42 },
  greetingDate: { maxWidth: 128, color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, lineHeight: 18, textAlign: 'right', paddingBottom: 4 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10, shadowColor: '#5B4FE9', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 5 }, shadowRadius: 16, elevation: 2 },
  currentCard: { borderWidth: 2, borderColor: LIGHT.primary },
  currentTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  cardTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  nowChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  nowChipText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  currentTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, marginTop: 5, marginBottom: 2 },
  periodTime: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  periodMeta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 19 },
  emptyMessage: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, paddingVertical: 3 },
  emptyDetail: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17 },
  sectionCaption: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  periodCard: { paddingVertical: 12, marginBottom: 9 },
  pastPeriod: { opacity: 0.55 },
  periodTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  periodBadge: { minWidth: 42, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center' },
  periodBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  periodTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, marginBottom: 2 },
  roomLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  roomText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
  questionCard: { borderRadius: 20, padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  questionIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  questionText: { flex: 1, marginLeft: 12 },
  questionTitle: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  questionCaption: { color: '#D1CEEA', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, marginTop: 2 },
  uploadLink: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  uploadLinkText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  navBar: { position: 'absolute', left: 16, right: 16, bottom: 16, height: 68, borderRadius: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 7 },
  navItem: { minWidth: 46, height: 46, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, gap: 6 },
  navLabel: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  horizontalChips: { gap: 8, paddingBottom: 14 },
  dayTabs: { flexDirection: 'row', padding: 4, borderRadius: 23, marginBottom: 13 },
  dayTab: { flex: 1, minHeight: 36, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayTabText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  routineCaption: { marginBottom: 11 },
  roomControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  dayPicker: { height: 40, minWidth: 108, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, borderRadius: 21, borderWidth: 1 },
  dayPickerText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 13 },
  roomTile: { width: '31.5%', height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 12, marginBottom: 9 },
  roomNumber: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  roomStatus: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, marginTop: 1 },
  roomDetail: { marginTop: 2 },
  roomScheduleRow: { paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LIGHT.border },
  roomScheduleMeta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, marginTop: 2 },
  roomLive: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, marginTop: 3 },
  searchBox: { height: 46, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 13 },
  searchInput: { flex: 1, height: '100%', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, padding: 0 },
  periodChips: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  teacherCaption: { marginTop: 10, marginBottom: 10 },
  teacherCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 9 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  teacherInfo: { flex: 1, marginLeft: 10 },
  teacherName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  teacherShort: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 10, marginTop: 2 },
  statusPill: { maxWidth: 122, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 14 },
  statusText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10 },
  backButton: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 },
  backText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  ruleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 13 },
  ruleNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ruleNumberText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  ruleContent: { flex: 1 },
  ruleTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, marginBottom: 3 },
  ruleText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18 },
  settingsCard: { marginBottom: 18 },
  settingsTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 },
  settingsDescription: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 13 },
  themeChoices: { flexDirection: 'row', gap: 9 },
  themeOption: { flex: 1, minHeight: 48, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 7 },
  themeOptionText: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  settingsSectionLabel: { marginTop: 2 },
  settingsSemesters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  uploadSettings: { minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  uploadSettingsText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
});
