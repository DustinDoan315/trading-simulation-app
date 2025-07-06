import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import colors from "@/styles/colors";

const CreateCollectionScreen = () => {
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  const [maxMembers, setMaxMembers] = useState("50");
  const [startingBalance, setStartingBalance] = useState("100000");
  const [duration, setDuration] = useState("30");
  const [rules, setRules] = useState({
    noShortSelling: false,
    maxPositionSize: false,
    restrictedAssets: false,
    minHoldTime: false,
  });

  const handleCreate = () => {
    if (!collectionName.trim()) {
      Alert.alert("Error", "Collection name is required");
      return;
    }

    // Create collection logic here
    console.log("Creating collection:", {
      name: collectionName,
      description,
      isPublic,
      allowInvites,
      maxMembers: parseInt(maxMembers),
      startingBalance: parseInt(startingBalance),
      duration: parseInt(duration),
      rules,
    });

    router.back();
  };

  const RuleToggle = ({ title, subtitle, value, onValueChange }: any) => (
    <View style={styles.ruleItem}>
      <View style={styles.ruleContent}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border.light, true: colors.ui.highlight }}
        thumbColor={colors.text.primary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Collection</Text>
        <TouchableOpacity onPress={handleCreate} style={styles.createButton}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Collection Name</Text>
            <TextInput
              style={styles.input}
              value={collectionName}
              onChangeText={setCollectionName}
              placeholder="Enter collection name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={50}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your collection..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          <View style={styles.settingsGroup}>
            <RuleToggle
              title="Public Collection"
              subtitle="Anyone can discover and join"
              value={isPublic}
              onValueChange={setIsPublic}
            />
            <RuleToggle
              title="Allow Invites"
              subtitle="Members can invite others"
              value={allowInvites}
              onValueChange={setAllowInvites}
            />
          </View>
        </View>

        {/* Collection Parameters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Parameters</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Members</Text>
            <TextInput
              style={styles.input}
              value={maxMembers}
              onChangeText={setMaxMembers}
              placeholder="50"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Balance ($)</Text>
            <TextInput
              style={styles.input}
              value={startingBalance}
              onChangeText={setStartingBalance}
              placeholder="100000"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (Days)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Trading Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trading Rules</Text>
          <View style={styles.settingsGroup}>
            <RuleToggle
              title="No Short Selling"
              subtitle="Disable short positions"
              value={rules.noShortSelling}
              onValueChange={(value) => setRules({...rules, noShortSelling: value})}
            />
            <RuleToggle
              title="Max Position Size"
              subtitle="Limit position size to 20% of portfolio"
              value={rules.maxPositionSize}
              onValueChange={(value) => setRules({...rules, maxPositionSize: value})}
            />
            <RuleToggle
              title="Restricted Assets"
              subtitle="Only allow top 100 cryptocurrencies"
              value={rules.restrictedAssets}
              onValueChange={(value) => setRules({...rules, restrictedAssets: value})}
            />
            <RuleToggle
              title="Minimum Hold Time"
              subtitle="Require 24-hour minimum hold time"
              value={rules.minHoldTime}
              onValueChange={(value) => setRules({...rules, minHoldTime: value})}
            />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName}>{collectionName || "Collection Name"}</Text>
              <View style={styles.previewBadge}>
                <Ionicons 
                  name={isPublic ? "globe-outline" : "lock-closed-outline"} 
                  size={12} 
                  color={colors.text.primary} 
                />
                <Text style={styles.previewBadgeText}>
                  {isPublic ? "Public" : "Private"}
                </Text>
              </View>
            </View>
            <Text style={styles.previewDescription}>
              {description || "No description provided"}
            </Text>
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatValue}>{maxMembers}</Text>
                <Text style={styles.previewStatLabel}>Max Members</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatValue}>${parseInt(startingBalance || "0").toLocaleString()}</Text>
                <Text style={styles.previewStatLabel}>Starting Balance</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatValue}>{duration} days</Text>
                <Text style={styles.previewStatLabel}>Duration</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131523",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: "#FFFFFF",
  },
  createButton: {
    backgroundColor: "#6674CC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingsGroup: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  ruleSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  previewCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ui.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
    marginLeft: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  previewStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

export default CreateCollectionScreen;